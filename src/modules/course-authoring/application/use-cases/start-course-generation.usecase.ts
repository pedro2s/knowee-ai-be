import { Inject, Injectable } from '@nestjs/common';
import { GenerateCourseDto } from '../dtos/generate-course.dto';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { GenerationEventsService } from '../services/generation-events.service';
import { GenerationJob } from '../../domain/entities/generation-job.types';
import {
	GENERATION_JOB_PAYLOAD_REPOSITORY,
	type GenerationJobPayloadRepositoryPort,
} from '../../domain/ports/generation-job-payload-repository.port';
import { GenerationQueueProducer } from '../../infrastructure/queue/generation-queue.producer';
import { GENERATION_QUEUE } from 'src/shared/queue/queue.constants';
import { GenerationJobDescriptorService } from '../services/generation-job-descriptor.service';

@Injectable()
export class StartCourseGenerationUseCase {
	constructor(
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		@Inject(GENERATION_JOB_PAYLOAD_REPOSITORY)
		private readonly generationJobPayloadRepository: GenerationJobPayloadRepositoryPort,
		private readonly generationQueueProducer: GenerationQueueProducer,
		private readonly generationEventsService: GenerationEventsService
	) {}

	async execute(input: {
		userId: string;
		data: GenerateCourseDto;
		files: Express.Multer.File[];
	}): Promise<GenerationJob> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'course_generation',
			targetLabel: input.data.title,
		});
		const job = await this.generationJobRepository.create(
			{
				userId: input.userId,
				status: 'pending',
				jobType: 'course_generation',
				jobFamily: descriptor.jobFamily,
				jobIntent: descriptor.jobIntent,
				phase: 'structure',
				progress: 0,
				dedupeKey: descriptor.dedupeKey,
				targetLabel: descriptor.targetLabel,
				scope: descriptor.scope,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'course_generation',
					...GenerationJobDescriptorService.toMetadata(descriptor),
				},
			},
			auth
		);

		await this.generationJobPayloadRepository.save(
			{
				jobId: job.id,
				userId: input.userId,
				payload: {
					type: 'course_generation',
					data: input.data,
					files: input.files.map((file) => ({
						originalname: file.originalname,
						mimetype: file.mimetype,
						bufferBase64: file.buffer.toString('base64'),
					})),
				},
			},
			auth
		);

		const queueJobId =
			await this.generationQueueProducer.enqueueCourseGeneration({
				jobId: job.id,
				userId: input.userId,
			});
		await this.generationJobRepository.update(
			job.id,
			{
				queueJobId,
				queueName: GENERATION_QUEUE,
			},
			auth
		);

		this.generationEventsService.publish(job.id, 'generation.snapshot', {
			jobId: job.id,
			status: job.status,
			phase: job.phase,
			progress: job.progress,
			courseId: job.courseId,
			metadata: job.metadata,
			error: job.error,
		});

		return job;
	}
}
