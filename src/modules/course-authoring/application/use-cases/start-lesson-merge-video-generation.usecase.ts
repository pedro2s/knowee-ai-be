import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import { GenerationJobPayloadRepositoryPort } from '../../domain/ports/generation-job-payload-repository.port';
import { GenerationQueueProducer } from '../../infrastructure/queue/generation-queue.producer';
import { GenerationEventsService } from '../services/generation-events.service';
import { GENERATION_QUEUE } from 'src/shared/queue/queue.constants';
import { GenerationJobDescriptorService } from '../services/generation-job-descriptor.service';
import { StartGenerationJobResult } from '../dtos/start-generation-job.result';

@Injectable()
export class StartLessonMergeVideoGenerationUseCase {
	constructor(
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly moduleRepository: ModuleRepositoryPort,
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly generationJobPayloadRepository: GenerationJobPayloadRepositoryPort,
		private readonly generationQueueProducer: GenerationQueueProducer,
		private readonly generationEventsService: GenerationEventsService
	) {}

	async execute(input: {
		userId: string;
		lessonId: string;
	}): Promise<StartGenerationJobResult> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const lesson = await this.lessonRepository.findById(input.lessonId, auth);
		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}
		const module = await this.moduleRepository.findById(lesson.moduleId, auth);
		if (!module) {
			throw new NotFoundException('Módulo da aula não encontrado');
		}

		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_merge_video_generation',
			courseId: module.courseId,
			lessonId: lesson.id,
			targetLabel: lesson.title,
		});

		if (descriptor.dedupeKey) {
			const existingJob =
				await this.generationJobRepository.findActiveByDedupeKey(
					descriptor.dedupeKey,
					auth
				);
			if (existingJob) {
				return {
					job: existingJob,
					started: false,
					reason: 'duplicate_active_job',
				};
			}
		}

		const job = await this.generationJobRepository.create(
			{
				userId: input.userId,
				courseId: module.courseId,
				status: 'pending',
				jobType: 'lesson_merge_video_generation',
				jobFamily: descriptor.jobFamily,
				jobIntent: descriptor.jobIntent,
				phase: 'lesson_merge_video',
				progress: 0,
				dedupeKey: descriptor.dedupeKey,
				targetLabel: descriptor.targetLabel,
				scope: descriptor.scope,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'lesson_merge_video_generation',
					...GenerationJobDescriptorService.toMetadata(descriptor),
					lessonId: lesson.id,
				},
			},
			auth
		);

		await this.generationJobPayloadRepository.save(
			{
				jobId: job.id,
				userId: input.userId,
				payload: {
					type: 'lesson_merge_video_generation',
					lessonId: lesson.id,
				},
			},
			auth
		);

		const queueJobId =
			await this.generationQueueProducer.enqueueLessonMergeVideoGeneration({
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

		return {
			job,
			started: true,
		};
	}
}
