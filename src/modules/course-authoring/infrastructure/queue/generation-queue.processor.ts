import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
	GENERATION_JOB_NAMES,
	GENERATION_QUEUE,
} from 'src/shared/queue/queue.constants';
import { GenerationJobPayloadRepositoryPort } from '../../domain/ports/generation-job-payload-repository.port';
import { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import { CourseGenerationOrchestratorUseCase } from '../../application/use-cases/course-generation-orchestrator.usecase';
import { AssetsGenerationOrchestratorUseCase } from '../../application/use-cases/assets-generation-orchestrator.usecase';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';
import { GenerateSectionVideoUseCase } from '../../application/use-cases/generate-section-video.usecase';
import { MergeLessonSectionsVideoUseCase } from '../../application/use-cases/merge-lesson-sections-video.usecase';
import {
	type GenerationQueueJobData,
	type PersistedGenerationJobPayload,
} from './generation-queue.types';
import { GenerationEventsService } from '../../application/services/generation-events.service';
import { GenerationJobDescriptorService } from '../../application/services/generation-job-descriptor.service';

const workerConcurrency = Number(process.env.WORKER_CONCURRENCY ?? 1) || 1;

@Processor(GENERATION_QUEUE, {
	concurrency: workerConcurrency,
})
export class GenerationQueueProcessor extends WorkerHost {
	private readonly logger = new Logger(GenerationQueueProcessor.name);

	constructor(
		private readonly payloadRepository: GenerationJobPayloadRepositoryPort,
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly courseOrchestrator: CourseGenerationOrchestratorUseCase,
		private readonly assetsOrchestrator: AssetsGenerationOrchestratorUseCase,
		private readonly generateLessonAudioUseCase: GenerateLessonAudioUseCase,
		private readonly generateSectionVideoUseCase: GenerateSectionVideoUseCase,
		private readonly mergeLessonSectionsVideoUseCase: MergeLessonSectionsVideoUseCase,
		private readonly generationEventsService: GenerationEventsService
	) {
		super();
	}

	private getValidatedUserId(job: Job<GenerationQueueJobData>): string {
		const userId = job.data?.userId;

		if (typeof userId !== 'string' || userId.trim().length === 0) {
			throw new Error(
				`Invalid generation queue job: userId is required (jobId=${job.data?.jobId ?? 'unknown'}, name=${job.name}, data=${JSON.stringify(job.data)})`
			);
		}

		return userId.trim();
	}

	private getJobAuth(job: Job<GenerationQueueJobData>) {
		return {
			userId: this.getValidatedUserId(job),
			role: 'authenticated' as const,
		};
	}

	private async getPayload(
		job: Job<GenerationQueueJobData>
	): Promise<PersistedGenerationJobPayload> {
		const auth = this.getJobAuth(job);
		const payload = await this.payloadRepository.findByJobId(
			job.data.jobId,
			auth
		);
		if (!payload) {
			throw new Error(`Payload não encontrado para job ${job.data.jobId}`);
		}

		return payload as unknown as PersistedGenerationJobPayload;
	}

	async process(job: Job<GenerationQueueJobData>): Promise<void> {
		const auth = this.getJobAuth(job);
		const userId = auth.userId;
		const payload = await this.getPayload(job);

		await this.generationJobRepository.update(
			job.data.jobId,
			{
				attempts: job.attemptsMade,
				queueJobId: job.id ? String(job.id) : job.data.jobId,
				heartbeatAt: new Date(),
			},
			auth
		);

		switch (job.name) {
			case GENERATION_JOB_NAMES.COURSE_GENERATE: {
				if (payload.type !== 'course_generation') {
					throw new Error('Payload inválido para course.generate');
				}

				const files = payload.files.map((file) => ({
					originalname: file.originalname,
					mimetype: file.mimetype ?? 'application/octet-stream',
					buffer: Buffer.from(file.bufferBase64, 'base64'),
				})) as Express.Multer.File[];

				await this.courseOrchestrator.run({
					jobId: job.data.jobId,
					userId,
					data: payload.data,
					files,
				});

				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
				break;
			}

			case GENERATION_JOB_NAMES.ASSETS_GENERATE: {
				if (payload.type !== 'assets_generation') {
					throw new Error('Payload inválido para assets.generate');
				}

				await this.assetsOrchestrator.run({
					jobId: job.data.jobId,
					userId,
					courseId: payload.data.courseId,
					lessonIds: payload.data.lessonIds ?? [],
					strategy: payload.data.strategy as 'selected' | 'all',
					providerSelection: payload.data.providerSelection,
				});

				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
				break;
			}

			case GENERATION_JOB_NAMES.LESSON_AUDIO_GENERATE: {
				if (payload.type !== 'lesson_audio_generation') {
					throw new Error('Payload inválido para lesson.audio.generate');
				}

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'processing',
						phase: 'lesson_audio',
						progress: 10,
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.phase.started',
					{
						phase: 'lesson_audio',
						progress: 10,
					}
				);

				await this.generateLessonAudioUseCase.execute({
					lessonId: payload.lessonId,
					audioProvider: payload.audioProvider,
					audioVoiceId: payload.audioVoiceId,
					userId,
					runInBackground: false,
				});

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'completed',
						phase: 'done',
						progress: 100,
						completedAt: new Date(),
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.completed',
					{
						progress: 100,
						lessonId: payload.lessonId,
					}
				);
				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
				break;
			}

			case GENERATION_JOB_NAMES.LESSON_SECTION_VIDEO_GENERATE: {
				if (payload.type !== 'lesson_section_video_generation') {
					throw new Error(
						'Payload inválido para lesson.section-video.generate'
					);
				}

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'processing',
						phase: 'lesson_section_video',
						progress: 10,
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.phase.started',
					{
						phase: 'lesson_section_video',
						progress: 10,
						lessonId: payload.data.lessonId,
						sectionId: payload.data.sectionId,
					}
				);

				const sectionResult = await this.generateSectionVideoUseCase.execute(
					payload.data,
					userId
				);

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'completed',
						phase: 'done',
						progress: 100,
						metadata: {
							jobType: 'lesson_section_video_generation',
							...GenerationJobDescriptorService.toMetadata(
								GenerationJobDescriptorService.build({
									jobType: 'lesson_section_video_generation',
									lessonId: payload.data.lessonId,
									sectionId: payload.data.sectionId,
								})
							),
							lessonId: payload.data.lessonId,
							sectionId: payload.data.sectionId,
							videoUrl: sectionResult.videoUrl,
							videoStatus: sectionResult.videoStatus,
						},
						completedAt: new Date(),
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.completed',
					{
						progress: 100,
						lessonId: payload.data.lessonId,
						sectionId: payload.data.sectionId,
						videoUrl: sectionResult.videoUrl,
						videoStatus: sectionResult.videoStatus,
					}
				);
				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
				break;
			}

			case GENERATION_JOB_NAMES.LESSON_MERGE_VIDEO_GENERATE: {
				if (payload.type !== 'lesson_merge_video_generation') {
					throw new Error('Payload inválido para lesson.merge-video.generate');
				}

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'processing',
						phase: 'lesson_merge_video',
						progress: 10,
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.phase.started',
					{
						phase: 'lesson_merge_video',
						progress: 10,
						lessonId: payload.lessonId,
					}
				);

				const mergeResult = await this.mergeLessonSectionsVideoUseCase.execute(
					payload.lessonId,
					userId
				);

				await this.generationJobRepository.update(
					job.data.jobId,
					{
						status: 'completed',
						phase: 'done',
						progress: 100,
						metadata: {
							jobType: 'lesson_merge_video_generation',
							...GenerationJobDescriptorService.toMetadata(
								GenerationJobDescriptorService.build({
									jobType: 'lesson_merge_video_generation',
									lessonId: payload.lessonId,
								})
							),
							lessonId: payload.lessonId,
							...mergeResult,
						},
						completedAt: new Date(),
					},
					auth
				);
				this.generationEventsService.publish(
					job.data.jobId,
					'generation.completed',
					{
						progress: 100,
						lessonId: payload.lessonId,
						...mergeResult,
					}
				);
				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
				break;
			}

			default: {
				throw new Error(`Job name não suportado: ${job.name}`);
			}
		}
	}

	@OnWorkerEvent('active')
	async onActive(job: Job<GenerationQueueJobData>) {
		const auth = this.getJobAuth(job);
		await this.generationJobRepository.update(
			job.data.jobId,
			{
				startedAt: new Date(),
				heartbeatAt: new Date(),
				queueJobId: job.id ? String(job.id) : job.data.jobId,
				attempts: job.attemptsMade,
			},
			auth
		);
	}

	@OnWorkerEvent('completed')
	async onCompleted(job: Job<GenerationQueueJobData>) {
		const auth = this.getJobAuth(job);
		await this.generationJobRepository.update(
			job.data.jobId,
			{
				heartbeatAt: new Date(),
				attempts: job.attemptsMade,
			},
			auth
		);
	}

	@OnWorkerEvent('failed')
	async onFailed(job: Job<GenerationQueueJobData>, error: Error) {
		if (!job) {
			return;
		}

		const auth = this.getJobAuth(job);
		const currentJob = await this.generationJobRepository.findById(
			job.data.jobId,
			auth
		);
		if (
			currentJob &&
			(currentJob.status === 'completed' ||
				currentJob.completedAt !== null ||
				currentJob.phase === 'done')
		) {
			this.logger.warn(
				`Ignorando falha tardia do worker para job concluido ${job.data.jobId}: ${error.message}`
			);
			return;
		}

		const maxAttempts = job.opts.attempts ?? 1;
		const isFinalFailure = job.attemptsMade >= maxAttempts;

		await this.generationJobRepository.update(
			job.data.jobId,
			{
				attempts: job.attemptsMade,
				heartbeatAt: new Date(),
				error: error.message,
				maxAttempts,
				status: isFinalFailure ? 'failed' : 'pending',
			},
			auth
		);

		if (isFinalFailure) {
			this.generationEventsService.publish(
				job.data.jobId,
				'generation.failed',
				{
					error: error.message,
				}
			);
			try {
				await this.payloadRepository.deleteByJobId(job.data.jobId, auth);
			} catch (deleteError) {
				this.logger.warn(
					`Falha ao limpar payload do job ${job.data.jobId}: ${
						deleteError instanceof Error
							? deleteError.message
							: String(deleteError)
					}`
				);
			}
		}
	}
}
