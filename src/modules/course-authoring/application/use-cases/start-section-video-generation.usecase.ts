import { Injectable, NotFoundException } from '@nestjs/common';
import { GenerateSectionVideoDto } from '../dtos/generate-section-video.dto';
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
export class StartSectionVideoGenerationUseCase {
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
		data: GenerateSectionVideoDto;
	}): Promise<StartGenerationJobResult> {
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

		const sectionLabel =
			(
				lesson.content as {
					scriptSections?: Array<{
						id?: string;
						content?: string;
					}>;
				}
			)?.scriptSections
				?.find((section) => section.id === input.data.sectionId)
				?.content?.split('\n')[0]
				?.replace(/#+/g, '')
				?.trim() ?? null;

		const descriptor = GenerationJobDescriptorService.build({
			jobType: 'lesson_section_video_generation',
			courseId: module.courseId,
			lessonId: input.data.lessonId,
			sectionId: input.data.sectionId,
			targetLabel: lesson.title,
			sectionLabel,
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
				jobType: 'lesson_section_video_generation',
				jobFamily: descriptor.jobFamily,
				jobIntent: descriptor.jobIntent,
				phase: 'lesson_section_video',
				progress: 0,
				dedupeKey: descriptor.dedupeKey,
				targetLabel: descriptor.targetLabel,
				scope: descriptor.scope,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'lesson_section_video_generation',
					...GenerationJobDescriptorService.toMetadata(descriptor),
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

		return {
			job,
			started: true,
		};
	}
}
