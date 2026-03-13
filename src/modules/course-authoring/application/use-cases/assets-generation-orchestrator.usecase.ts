import { Injectable, Logger } from '@nestjs/common';
import { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import { GenerationEventsService } from '../services/generation-events.service';
import { GenerationJobDescriptorService } from '../services/generation-job-descriptor.service';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import { MergeLessonSectionsVideoUseCase } from './merge-lesson-sections-video.usecase';
import { GenerateLessonAudioUseCase } from './generate-lesson-audio.usecase';
import { ScriptSection } from '../../domain/entities/lesson-script.types';
import { GenerateArticleUseCase } from './generate-article.usecase';
import { GenerateQuizUseCase } from './generate-quiz.usecase';
import { GenerateLessonScriptUseCase } from './generate-lesson-script.usecase';
import {
	AssetBlockingIssue,
	buildBlockingIssue,
	evaluateLessonExportReadiness,
	getSafeLessonContent,
	LessonReadiness,
} from '../services/asset-export-readiness';

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
	readiness: LessonReadiness;
	error?: string;
};

@Injectable()
export class AssetsGenerationOrchestratorUseCase {
	private readonly logger = new Logger(
		AssetsGenerationOrchestratorUseCase.name
	);

	constructor(
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly generationEventsService: GenerationEventsService,
		private readonly generateSectionVideoUseCase: GenerateSectionVideoUseCase,
		private readonly mergeLessonSectionsVideoUseCase: MergeLessonSectionsVideoUseCase,
		private readonly generateLessonAudioUseCase: GenerateLessonAudioUseCase,
		private readonly generateArticleUseCase: GenerateArticleUseCase,
		private readonly generateQuizUseCase: GenerateQuizUseCase,
		private readonly generateLessonScriptUseCase: GenerateLessonScriptUseCase
	) {}

	async run(input: AssetsGenerationInput): Promise<void> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const summary: SummaryItem[] = [];
		const blockingIssues: AssetBlockingIssue[] = [];
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
					blockingIssues.push(
						buildBlockingIssue({
							lessonId,
							lessonType: 'unknown',
							code: 'lesson_not_found',
							message: 'Aula nao encontrada durante a geracao de assets.',
						})
					);
					summary.push({
						lessonId,
						lessonType: 'unknown',
						status: 'failed',
						readiness: 'blocked',
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
						const lessonWithScript = await this.ensureScriptSections({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							courseId: input.courseId,
							moduleId: lesson.moduleId,
							title: lesson.title,
							description: lesson.description ?? lesson.title,
							content: lesson.content,
							userId: input.userId,
						});
						const sections =
							(getSafeLessonContent(lessonWithScript?.content)
								.scriptSections as ScriptSection[] | undefined) ?? [];

						if (!sections.length) {
							blockingIssues.push(
								buildBlockingIssue({
									lessonId: lesson.id,
									lessonType: lesson.lessonType,
									code: 'video_script_missing',
									message:
										'A aula de video ficou sem roteiro apos a preparacao automatica.',
								})
							);
							summary.push({
								lessonId: lesson.id,
								lessonType: lesson.lessonType,
								status: 'failed',
								readiness: 'blocked',
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
										videoProvider: input.providerSelection.videoProvider,
									},
									input.userId
								);
							}

							await this.mergeLessonSectionsVideoUseCase.execute(
								lesson.id,
								input.userId
							);

							const refreshedLesson = await this.lessonRepository.findById(
								lesson.id,
								auth
							);
							const readiness = evaluateLessonExportReadiness({
								lessonId: lesson.id,
								lessonType: lesson.lessonType,
								content: refreshedLesson?.content,
							});
							blockingIssues.push(...readiness.blockingIssues);

							summary.push({
								lessonId: lesson.id,
								lessonType: lesson.lessonType,
								status: readiness.isReady ? 'success' : 'failed',
								readiness: readiness.readiness,
								error: readiness.blockingIssues[0]?.code,
							});
						}
					} else if (lesson.lessonType === 'audio') {
						await this.ensureScriptSections({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							courseId: input.courseId,
							moduleId: lesson.moduleId,
							title: lesson.title,
							description: lesson.description ?? lesson.title,
							content: lesson.content,
							userId: input.userId,
						});

						await this.generateLessonAudioUseCase.execute({
							lessonId: lesson.id,
							audioProvider: input.providerSelection.audioProvider,
							audioVoiceId: input.providerSelection.audioVoiceId,
							userId: input.userId,
							runInBackground: false,
						});

						const refreshedLesson = await this.lessonRepository.findById(
							lesson.id,
							auth
						);
						const readiness = evaluateLessonExportReadiness({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							content: refreshedLesson?.content,
						});
						blockingIssues.push(...readiness.blockingIssues);
						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: readiness.isReady ? 'success' : 'failed',
							readiness: readiness.readiness,
							error: readiness.blockingIssues[0]?.code,
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
							readiness: 'ready',
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
							readiness: 'ready',
						});
					} else if (
						lesson.lessonType === 'pdf' ||
						lesson.lessonType === 'external'
					) {
						const readiness = evaluateLessonExportReadiness({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							content: lesson.content,
						});
						blockingIssues.push(...readiness.blockingIssues);
						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: readiness.isReady ? 'success' : 'failed',
							readiness: readiness.readiness,
							error: readiness.blockingIssues[0]?.code,
						});
					} else {
						const unsupportedIssue = buildBlockingIssue({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							code: 'unsupported_lesson_type',
							message: `Tipo de aula nao suportado para geracao automatica: ${lesson.lessonType}.`,
						});
						blockingIssues.push(unsupportedIssue);
						summary.push({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							status: 'failed',
							readiness: 'blocked',
							error: unsupportedIssue.code,
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
						readiness: 'blocked',
						error: message,
					});
					blockingIssues.push(
						buildBlockingIssue({
							lessonId: lesson.id,
							lessonType: lesson.lessonType,
							code: 'generation_failed',
							message,
						})
					);
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
			const isExportReady = blockingIssues.length === 0;

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
					status: isExportReady ? 'completed' : 'failed',
					phase: 'done',
					progress: 100,
					metadata: {
						jobType: 'assets_generation',
						...GenerationJobDescriptorService.toMetadata(
							GenerationJobDescriptorService.build({
								jobType: 'assets_generation',
								courseId: input.courseId,
								selectedLessonIds: input.lessonIds,
								targetLabel: `${input.lessonIds.length} aula(s) em processamento`,
							})
						),
						strategy: input.strategy,
						providerSelection: input.providerSelection,
						selectedLessonIds: input.lessonIds,
						lessonSummary,
						isExportReady,
						blockingIssues,
					},
					error: isExportReady
						? null
						: `${blockingIssues.length} pendencia(s) bloqueiam a exportacao do curso.`,
					completedAt: new Date(),
				},
				auth
			);

			this.generationEventsService.publish(
				input.jobId,
				'generation.assets.summary',
				{
					...lessonSummary,
					isExportReady,
					blockingIssues,
				}
			);
			if (isExportReady) {
				this.generationEventsService.publish(
					input.jobId,
					'generation.completed',
					{
						courseId: input.courseId,
						progress: 100,
						isExportReady: true,
					}
				);
			} else {
				this.generationEventsService.publish(input.jobId, 'generation.failed', {
					error: `${blockingIssues.length} pendencia(s) bloqueiam a exportacao do curso.`,
					courseId: input.courseId,
					progress: 100,
					isExportReady: false,
					blockingIssues,
				});
			}
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
			throw error;
		}
	}

	private async ensureScriptSections(input: {
		lessonId: string;
		lessonType: string;
		courseId: string;
		moduleId: string;
		title: string;
		description: string;
		content: unknown;
		userId: string;
	}) {
		const currentContent = getSafeLessonContent(input.content);
		const scriptSections = Array.isArray(currentContent.scriptSections)
			? (currentContent.scriptSections as ScriptSection[])
			: [];

		if (scriptSections.length > 0) {
			return {
				id: input.lessonId,
				content: currentContent,
			};
		}

		const generatedScript = await this.generateLessonScriptUseCase.execute(
			{
				courseId: input.courseId,
				moduleId: input.moduleId,
				title: input.title,
				description: input.description,
				ai: {
					provider: 'openai',
				},
			},
			input.userId
		);

		await this.lessonRepository.update(
			input.lessonId,
			{
				content: {
					...currentContent,
					scriptSections: generatedScript.scriptSections,
				},
			},
			{ userId: input.userId, role: 'authenticated' as const }
		);

		return this.lessonRepository.findById(input.lessonId, {
			userId: input.userId,
			role: 'authenticated' as const,
		});
	}
}
