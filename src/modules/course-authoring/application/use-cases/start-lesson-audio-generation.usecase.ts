import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { GenerationJobDescriptorService } from '../services/generation-job-descriptor.service';
import { StartGenerationJobResult } from '../dtos/start-generation-job.result';

@Injectable()
export class StartLessonAudioGenerationUseCase {
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
		lessonId: string;
		audioProvider: string;
		audioVoiceId?: string;
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
			jobType: 'lesson_audio_generation',
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
				jobType: 'lesson_audio_generation',
				jobFamily: descriptor.jobFamily,
				jobIntent: descriptor.jobIntent,
				phase: 'lesson_audio',
				progress: 0,
				dedupeKey: descriptor.dedupeKey,
				targetLabel: descriptor.targetLabel,
				scope: descriptor.scope,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'lesson_audio_generation',
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
					type: 'lesson_audio_generation',
					lessonId: lesson.id,
					audioProvider: input.audioProvider,
					audioVoiceId: input.audioVoiceId,
				},
			},
			auth
		);

		const queueJobId =
			await this.generationQueueProducer.enqueueLessonAudioGeneration({
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
