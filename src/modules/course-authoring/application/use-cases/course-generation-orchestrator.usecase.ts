import { Injectable, Logger } from '@nestjs/common';
import { GenerateCourseDto } from '../dtos/generate-course.dto';
import { GenerateCourseUseCase } from './generate-course.usecase';
import { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import { GenerationEventsService } from '../services/generation-events.service';
import { GenerateLessonScriptUseCase } from './generate-lesson-script.usecase';
import { GenerateLessonStoryboardUseCase } from './generate-lesson-storyboard.usecase';
import { GenerateSectionVideoUseCase } from './generate-section-video.usecase';
import { GenerateArticleUseCase } from './generate-article.usecase';
import { GenerateQuizUseCase } from './generate-quiz.usecase';
import { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { MarkFreemiumSampleConsumedUseCase } from 'src/modules/access-control/application/use-cases/mark-freemium-sample-consumed.usecase';
import { GenerationJobDescriptorService } from '../services/generation-job-descriptor.service';
import { Module } from '../../domain/entities/module.entity';
import { Lesson } from '../../domain/entities/lesson.entity';
import { GeneratedLessonScript } from '../../domain/entities/lesson-script.types';
import { GenerationJobMetadata } from '../../domain/entities/generation-job.types';

interface CourseGenerationInput {
	jobId: string;
	userId: string;
	data: GenerateCourseDto;
	files: Express.Multer.File[];
}

type TextContentSummary = NonNullable<
	GenerationJobMetadata['textContentSummary']
>;
type TextContentSummaryItem = TextContentSummary['items'][number];

@Injectable()
export class CourseGenerationOrchestratorUseCase {
	private readonly logger = new Logger(
		CourseGenerationOrchestratorUseCase.name
	);

	constructor(
		private readonly generateCourseUseCase: GenerateCourseUseCase,
		private readonly generateLessonScriptUseCase: GenerateLessonScriptUseCase,
		private readonly generateArticleUseCase: GenerateArticleUseCase,
		private readonly generateQuizUseCase: GenerateQuizUseCase,
		private readonly generateLessonStoryboardUseCase: GenerateLessonStoryboardUseCase,
		private readonly generateSectionVideoUseCase: GenerateSectionVideoUseCase,
		private readonly generationEventsService: GenerationEventsService,
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly courseRepository: CourseRepositoryPort,
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly markFreemiumSampleConsumedUseCase: MarkFreemiumSampleConsumedUseCase
	) {}

	private createEmptyTextContentSummary(): TextContentSummary {
		return {
			total: 0,
			success: 0,
			failed: 0,
			skipped: 0,
			items: [],
		};
	}

	private buildTextSummary(
		items: TextContentSummaryItem[]
	): TextContentSummary {
		return {
			total: items.length,
			success: items.filter((item) => item.status === 'success').length,
			failed: items.filter((item) => item.status === 'failed').length,
			skipped: items.filter((item) => item.status === 'skipped').length,
			items,
		};
	}

	private async generateAndPersistScript(params: {
		courseId: string;
		moduleId: string;
		lesson: Lesson;
		userId: string;
		auth: { userId: string; role: 'authenticated' };
	}): Promise<GeneratedLessonScript> {
		const generatedScript = await this.generateLessonScriptUseCase.execute(
			{
				courseId: params.courseId,
				moduleId: params.moduleId,
				title: params.lesson.title,
				description: params.lesson.description ?? '',
				ai: {
					provider: 'openai',
				},
			},
			params.userId
		);

		await this.lessonRepository.update(
			params.lesson.id,
			{
				content: {
					...(params.lesson.content as Record<string, unknown>),
					scriptSections: generatedScript.scriptSections,
				},
			},
			params.auth
		);

		return generatedScript;
	}

	private async generateTextContentForCourse(params: {
		jobId: string;
		courseId: string;
		modules: Module[];
		demoLessonId: string;
		userId: string;
		auth: { userId: string; role: 'authenticated' };
	}): Promise<{
		textContentSummary: TextContentSummary;
		demoScript: GeneratedLessonScript | null;
	}> {
		const eligibleLessons = params.modules.flatMap((module) =>
			(module.lessons ?? []).filter((lesson) =>
				['video', 'audio', 'article', 'quiz'].includes(lesson.lessonType)
			)
		);
		const items: TextContentSummaryItem[] = [];
		let processedCount = 0;
		let demoScript: GeneratedLessonScript | null = null;

		for (const module of params.modules) {
			for (const lesson of module.lessons ?? []) {
				let summaryItem: TextContentSummaryItem | null = null;

				try {
					switch (lesson.lessonType) {
						case 'video':
						case 'audio': {
							const generatedScript = await this.generateAndPersistScript({
								courseId: params.courseId,
								moduleId: module.id,
								lesson,
								userId: params.userId,
								auth: params.auth,
							});
							if (lesson.id === params.demoLessonId) {
								demoScript = generatedScript;
							}
							summaryItem = {
								lessonId: lesson.id,
								moduleId: module.id,
								lessonType: lesson.lessonType,
								contentKind: 'script',
								status: 'success',
							};
							break;
						}
						case 'article': {
							const generatedArticle =
								await this.generateArticleUseCase.execute(
									{
										courseId: params.courseId,
										moduleId: module.id,
										title: lesson.title,
										description: lesson.description ?? '',
										ai: {
											provider: 'openai',
										},
									},
									params.userId
								);
							await this.lessonRepository.update(
								lesson.id,
								{
									content: {
										...(lesson.content as Record<string, unknown>),
										articleContent: generatedArticle.content,
									},
								},
								params.auth
							);
							summaryItem = {
								lessonId: lesson.id,
								moduleId: module.id,
								lessonType: lesson.lessonType,
								contentKind: 'article',
								status: 'success',
							};
							break;
						}
						case 'quiz': {
							const generatedQuiz = await this.generateQuizUseCase.execute(
								{
									courseId: params.courseId,
									moduleId: module.id,
								},
								params.userId
							);
							await this.lessonRepository.update(
								lesson.id,
								{
									content: {
										...(lesson.content as Record<string, unknown>),
										quizQuestions: generatedQuiz.quizQuestions,
									},
								},
								params.auth
							);
							summaryItem = {
								lessonId: lesson.id,
								moduleId: module.id,
								lessonType: lesson.lessonType,
								contentKind: 'quiz',
								status: 'success',
							};
							break;
						}
						default:
							break;
					}
				} catch (error) {
					const contentKind: TextContentSummaryItem['contentKind'] =
						lesson.lessonType === 'article'
							? 'article'
							: lesson.lessonType === 'quiz'
								? 'quiz'
								: 'script';
					this.logger.warn(
						`Job ${params.jobId}: falha ao gerar conteudo textual da aula ${lesson.id}. ${
							error instanceof Error ? error.message : String(error)
						}`
					);
					summaryItem = {
						lessonId: lesson.id,
						moduleId: module.id,
						lessonType: lesson.lessonType,
						contentKind,
						status: 'failed',
						error:
							error instanceof Error
								? error.message
								: 'Falha ao gerar conteudo textual',
					};
				}

				if (!summaryItem) {
					continue;
				}

				items.push(summaryItem);
				processedCount += 1;
				const summary = this.buildTextSummary(items);
				const progress = eligibleLessons.length
					? 25 + Math.round((processedCount / eligibleLessons.length) * 40)
					: 65;

				await this.generationJobRepository.update(
					params.jobId,
					{
						phase: 'course_text_content',
						progress,
						metadata: {
							jobType: 'course_generation',
							textContentSummary: summary,
						},
					},
					params.auth
				);
				this.generationEventsService.publish(
					params.jobId,
					'generation.phase.progress',
					{
						phase: 'course_text_content',
						progress,
						courseId: params.courseId,
						textContentSummary: summary,
					}
				);
			}
		}

		return {
			textContentSummary: this.buildTextSummary(items),
			demoScript,
		};
	}

	async run(input: CourseGenerationInput): Promise<void> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		let textContentSummary = this.createEmptyTextContentSummary();

		try {
			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'processing',
					phase: 'structure',
					progress: 5,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'structure',
					progress: 5,
				}
			);

			const savedCourse = await this.generateCourseUseCase.execute({
				...input.data,
				userId: input.userId,
				files: input.files,
			});
			await this.markFreemiumSampleConsumedUseCase.execute(
				input.userId,
				savedCourse.id
			);

			await this.generationJobRepository.update(
				input.jobId,
				{
					courseId: savedCourse.id,
					dedupeKey: `course:${savedCourse.id}:generation`,
					targetLabel: savedCourse.title,
					scope: {
						courseId: savedCourse.id,
						lessonId: null,
						sectionId: null,
					},
					metadata: {
						jobType: 'course_generation',
						...GenerationJobDescriptorService.toMetadata(
							GenerationJobDescriptorService.build({
								jobType: 'course_generation',
								courseId: savedCourse.id,
								targetLabel: savedCourse.title,
							})
						),
					},
					phase: 'course_text_content',
					progress: 25,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'structure',
					progress: 25,
					courseId: savedCourse.id,
				}
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.redirect-ready',
				{
					courseId: savedCourse.id,
				}
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'course_text_content',
					progress: 25,
					courseId: savedCourse.id,
				}
			);

			const fullCourse = await this.courseRepository.findById(
				savedCourse.id,
				auth
			);
			const firstModule = fullCourse?.modules?.[0];
			const firstLesson = firstModule?.lessons?.[0];

			if (!firstModule || !firstLesson) {
				throw new Error('Curso sem módulo/aula para gerar demo');
			}

			const textGenerationResult = await this.generateTextContentForCourse({
				jobId: input.jobId,
				courseId: savedCourse.id,
				modules: fullCourse?.modules ?? [],
				demoLessonId: firstLesson.id,
				userId: input.userId,
				auth,
			});
			textContentSummary = textGenerationResult.textContentSummary;

			await this.generationJobRepository.update(
				input.jobId,
				{
					phase: 'demo_script',
					progress: 65,
					metadata: {
						jobType: 'course_generation',
						textContentSummary,
					},
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'course_text_content',
					progress: 65,
					courseId: savedCourse.id,
					textContentSummary,
				}
			);

			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'demo_script',
					progress: 65,
					courseId: savedCourse.id,
					textContentSummary,
				}
			);

			if (!textGenerationResult.demoScript) {
				await this.generateAndPersistScript({
					courseId: savedCourse.id,
					moduleId: firstModule.id,
					lesson: firstLesson,
					userId: input.userId,
					auth,
				});
			}

			await this.generationJobRepository.update(
				input.jobId,
				{
					phase: 'demo_storyboard',
					progress: 75,
					metadata: {
						jobType: 'course_generation',
						textContentSummary,
					},
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'demo_script',
					progress: 75,
					courseId: savedCourse.id,
					textContentSummary,
				}
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'demo_storyboard',
					progress: 75,
					courseId: savedCourse.id,
					textContentSummary,
				}
			);

			const storyboard = await this.generateLessonStoryboardUseCase.execute({
				courseId: savedCourse.id,
				moduleId: firstModule.id,
				lessonId: firstLesson.id,
				userId: input.userId,
			});

			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'demo_storyboard',
					progress: 85,
					courseId: savedCourse.id,
					textContentSummary,
				}
			);

			let demoSectionId: string | undefined;
			let demoSectionVideoUrl: string | undefined;
			let demoSectionVideoStatus: 'ready' | 'missing' | 'failed' = 'missing';
			const refreshedLesson = await this.lessonRepository.findById(
				firstLesson.id,
				auth
			);
			const firstSection = (
				refreshedLesson?.content as { scriptSections?: Array<{ id: string }> }
			)?.scriptSections?.[0];

			if (!firstSection?.id) {
				this.logger.warn(
					`Job ${input.jobId}: aula demo sem scriptSections para gerar preview.`
				);
			} else {
				demoSectionId = firstSection.id;
				try {
					await this.generationJobRepository.update(
						input.jobId,
						{
							phase: 'demo_section_video',
							progress: 85,
							metadata: {
								jobType: 'course_generation',
								textContentSummary,
							},
						},
						auth
					);
					this.generationEventsService.publish(
						input.jobId,
						'generation.phase.started',
						{
							phase: 'demo_section_video',
							progress: 85,
							courseId: savedCourse.id,
							textContentSummary,
						}
					);
					const generatedSection =
						await this.generateSectionVideoUseCase.execute(
							{
								lessonId: firstLesson.id,
								sectionId: firstSection.id,
								imageProvider: 'openai',
								audioProvider: 'openai',
							},
							input.userId
						);

					demoSectionVideoUrl = generatedSection.videoUrl;
					demoSectionVideoStatus = demoSectionVideoUrl ? 'ready' : 'missing';
				} catch (sectionError) {
					demoSectionVideoStatus = 'failed';
					this.logger.error(
						`Job ${input.jobId}: falha ao gerar vídeo preview da section demo ${firstSection.id}.`,
						sectionError instanceof Error ? sectionError.stack : undefined
					);
				}
			}

			await this.generationJobRepository.update(
				input.jobId,
				{
					phase: 'demo_section_video',
					progress: 95,
					metadata: {
						jobType: 'course_generation',
						textContentSummary,
					},
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'demo_section_video',
					progress: 95,
					courseId: savedCourse.id,
					demoSectionVideoStatus,
					textContentSummary,
				}
			);

			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'completed',
					phase: 'done',
					progress: 100,
					metadata: {
						jobType: 'course_generation',
						...GenerationJobDescriptorService.toMetadata(
							GenerationJobDescriptorService.build({
								jobType: 'course_generation',
								courseId: savedCourse.id,
								targetLabel: savedCourse.title,
							})
						),
						moduleId: firstModule.id,
						lessonId: firstLesson.id,
						demoSectionId,
						demoSectionVideoUrl,
						demoSectionVideoStatus,
						textContentSummary,
						totalSections: storyboard.totalSections,
						totalScenes: storyboard.totalScenes,
					},
					completedAt: new Date(),
				},
				auth
			);

			this.generationEventsService.publish(
				input.jobId,
				'generation.demo-ready',
				{
					courseId: savedCourse.id,
					moduleId: firstModule.id,
					lessonId: firstLesson.id,
					demoSectionId,
					demoSectionVideoUrl,
					demoSectionVideoStatus,
					textContentSummary,
					totalSections: storyboard.totalSections,
					totalScenes: storyboard.totalScenes,
				}
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.completed',
				{
					courseId: savedCourse.id,
					progress: 100,
					textContentSummary,
				}
			);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Erro desconhecido';
			this.logger.error(`Falha no job ${input.jobId}: ${message}`);

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
				textContentSummary,
			});
			throw error;
		}
	}
}
