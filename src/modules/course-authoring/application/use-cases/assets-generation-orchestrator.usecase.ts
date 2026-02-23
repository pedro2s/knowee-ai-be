import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { GenerationEventsService } from '../services/generation-events.service';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import { MergeLessonSectionsVideoUseCase } from './merge-lesson-sections-video.usecase';
import { GenerateLessonAudioUseCase } from './generate-lesson-audio.usecase';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import { GenerateArticleUseCase } from './generate-article.usecase';
import { GenerateQuizUseCase } from './generate-quiz.usecase';

interface AssetsGenerationInput {
	jobId: string;
	userId: string;
	courseId: string;
	lessonIds: string[];
	strategy: 'selected' | 'all';
	providerSelection: {
		imageProvider: string;
		audioProvider: string;
		audioVoiceId: string;
		videoProvider: string;
		advancedSettings?: Record<string, unknown>;
	};
}

type SummaryItem = {
	lessonId: string;
	lessonType: string;
	status: 'success' | 'failed' | 'skipped';
	error?: string;
};

@Injectable()
export class AssetsGenerationOrchestratorUseCase {
	private readonly logger = new Logger(
		AssetsGenerationOrchestratorUseCase.name
	);

	constructor(
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly generationEventsService: GenerationEventsService,
		private readonly generateSectionVideoUseCase: GenerateSectionVideoUseCase,
		private readonly mergeLessonSectionsVideoUseCase: MergeLessonSectionsVideoUseCase,
		private readonly generateLessonAudioUseCase: GenerateLessonAudioUseCase,
		private readonly generateArticleUseCase: GenerateArticleUseCase,
		private readonly generateQuizUseCase: GenerateQuizUseCase
	) {}

	async run(input: AssetsGenerationInput): Promise<void> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const summary: SummaryItem[] = [];
		const total = input.lessonIds.length;

		try {
			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'processing',
					phase: 'assets_processing',
					progress: 10,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'assets_processing',
					progress: 10,
					courseId: input.courseId,
				}
			);

			for (const [index, lessonId] of input.lessonIds.entries()) {
				const lesson = await this.lessonRepository.findById(lessonId, auth);
				if (!lesson) {
					summary.push({
						lessonId,
						lessonType: 'unknown',
						status: 'failed',
						error: 'Aula não encontrada',
					});
					continue;
				}

				this.generationEventsService.publish(
					input.jobId,
					'generation.assets.lesson.started',
					{
						lessonId: lesson.id,
						lessonType: lesson.lessonType,
						index: index + 1,
						total,
					}
				);

				try {
					if (lesson.lessonType === 'video') {
						const sections =
							(lesson.content as { scriptSections?: ScriptSection[] })
								.scriptSections ?? [];

						if (!sections.length) {
							summary.push({
								lessonId: lesson.id,
								lessonType: lesson.lessonType,
								status: 'skipped',
								error: 'no_script_sections',
							});
						} else {
							for (const section of sections) {
								await this.generateSectionVideoUseCase.execute(
									{
										lessonId: lesson.id,
										sectionId: section.id,
										imageProvider: input.providerSelection.imageProvider,
										audioProvider: input.providerSelection.audioProvider,
										audioVoiceId: input.providerSelection.audioVoiceId,
									},
									input.userId
								);
							}

							await this.mergeLessonSectionsVideoUseCase.execute(
								lesson.id,
								input.userId
							);

							summary.push({
								lessonId: lesson.id,
								lessonType: lesson.lessonType,
								status: 'success',
							});
						}
					} else if (lesson.lessonType === 'audio') {
						await this.generateLessonAudioUseCase.execute({
							lessonId: lesson.id,
							audioProvider: input.providerSelection.audioProvider,
							audioVoiceId: input.providerSelection.audioVoiceId,
							userId: input.userId,
							runInBackground: false,
						});
						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: 'success',
						});
					} else if (lesson.lessonType === 'article') {
						const generatedArticle = await this.generateArticleUseCase.execute(
							{
								courseId: input.courseId,
								moduleId: lesson.moduleId,
								title: lesson.title,
								description: lesson.description ?? lesson.title,
								ai: {
									provider: 'openai',
								},
							},
							input.userId
						);

						if (!generatedArticle.content?.trim()) {
							throw new Error('article_content_empty');
						}

						const currentContent =
							lesson.content && typeof lesson.content === 'object'
								? (lesson.content as Record<string, unknown>)
								: {};
						await this.lessonRepository.update(
							lesson.id,
							{
								content: {
									...currentContent,
									articleContent: generatedArticle.content,
								},
							},
							auth
						);

						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: 'success',
						});
					} else if (lesson.lessonType === 'quiz') {
						const generatedQuiz = await this.generateQuizUseCase.execute(
							{
								courseId: input.courseId,
								moduleId: lesson.moduleId,
							},
							input.userId
						);

						if (!generatedQuiz.quizQuestions?.length) {
							throw new Error('quiz_questions_empty');
						}

						const currentContent =
							lesson.content && typeof lesson.content === 'object'
								? (lesson.content as Record<string, unknown>)
								: {};
						await this.lessonRepository.update(
							lesson.id,
							{
								content: {
									...currentContent,
									quizQuestions: generatedQuiz.quizQuestions,
								},
							},
							auth
						);

						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: 'success',
						});
					} else {
						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: 'skipped',
							error: 'type_not_supported_for_auto_asset_generation',
						});
					}

					this.generationEventsService.publish(
						input.jobId,
						'generation.assets.lesson.completed',
						{
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: summary[summary.length - 1].status,
							index: index + 1,
							total,
						}
					);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: 'Erro inesperado ao gerar assets';
					this.logger.error(
						`Falha na geração de assets para aula ${lesson.id}: ${message}`
					);

					summary.push({
						lessonId: lesson.id,
						lessonType: lesson.lessonType,
						status: 'failed',
						error: message,
					});
					this.generationEventsService.publish(
						input.jobId,
						'generation.assets.lesson.failed',
						{
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							error: message,
							index: index + 1,
							total,
						}
					);
				}

				const progress = Math.min(
					95,
					Math.round(((index + 1) / total) * 80 + 10)
				);
				await this.generationJobRepository.update(
					input.jobId,
					{
						phase: 'assets_processing',
						progress,
					},
					auth
				);
				this.generationEventsService.publish(
					input.jobId,
					'generation.assets.lesson.progress',
					{
						progress,
						index: index + 1,
						total,
					}
				);
			}

			const lessonSummary = {
				total,
				success: summary.filter((item) => item.status === 'success').length,
				failed: summary.filter((item) => item.status === 'failed').length,
				skipped: summary.filter((item) => item.status === 'skipped').length,
				items: summary,
			};

			await this.generationJobRepository.update(
				input.jobId,
				{
					phase: 'assets_finalize',
					progress: 98,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'assets_finalize',
					progress: 98,
					courseId: input.courseId,
				}
			);

			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'completed',
					phase: 'done',
					progress: 100,
					metadata: {
						jobType: 'assets_generation',
						strategy: input.strategy,
						providerSelection: input.providerSelection,
						selectedLessonIds: input.lessonIds,
						lessonSummary,
					},
					completedAt: new Date(),
				},
				auth
			);

			this.generationEventsService.publish(
				input.jobId,
				'generation.assets.summary',
				lessonSummary
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.completed',
				{
					courseId: input.courseId,
					progress: 100,
				}
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Erro desconhecido';
			this.logger.error(`Falha no job de assets ${input.jobId}: ${message}`);

			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'failed',
					error: message,
				},
				auth
			);

			this.generationEventsService.publish(input.jobId, 'generation.failed', {
				error: message,
			});
		}
	}
}
