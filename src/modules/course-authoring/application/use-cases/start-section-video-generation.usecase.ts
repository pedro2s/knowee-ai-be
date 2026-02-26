import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GenerateSectionVideoDto } from '../dtos/generate-section-video.dto';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import {
	GENERATION_JOB_PAYLOAD_REPOSITORY,
	type GenerationJobPayloadRepositoryPort,
} from '../../domain/ports/generation-job-payload-repository.port';
import { GenerationQueueProducer } from '../../infrastructure/queue/generation-queue.producer';
import { GenerationEventsService } from '../services/generation-events.service';
import { GENERATION_QUEUE } from 'src/shared/queue/queue.constants';
import { GenerationJob } from '../../domain/entities/generation-job.types';

@Injectable()
export class StartSectionVideoGenerationUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		@Inject(GENERATION_JOB_PAYLOAD_REPOSITORY)
		private readonly generationJobPayloadRepository: GenerationJobPayloadRepositoryPort,
		private readonly generationQueueProducer: GenerationQueueProducer,
		private readonly generationEventsService: GenerationEventsService
	) {}

	async execute(input: {
		userId: string;
		data: GenerateSectionVideoDto;
	}): Promise<GenerationJob> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const lesson = await this.lessonRepository.findById(
			input.data.lessonId,
			auth
		);
		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}
		const module = await this.moduleRepository.findById(lesson.moduleId, auth);
		if (!module) {
			throw new NotFoundException('Módulo da aula não encontrado');
		}

		const job = await this.generationJobRepository.create(
			{
				userId: input.userId,
				courseId: module.courseId,
				status: 'pending',
				jobType: 'lesson_section_video_generation',
				phase: 'lesson_section_video',
				progress: 0,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'lesson_section_video_generation',
					lessonId: input.data.lessonId,
					sectionId: input.data.sectionId,
				},
			},
			auth
		);

		await this.generationJobPayloadRepository.save(
			{
				jobId: job.id,
				userId: input.userId,
				payload: {
					type: 'lesson_section_video_generation',
					data: input.data,
				},
			},
			auth
		);

		const queueJobId =
			await this.generationQueueProducer.enqueueLessonSectionVideoGeneration({
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
