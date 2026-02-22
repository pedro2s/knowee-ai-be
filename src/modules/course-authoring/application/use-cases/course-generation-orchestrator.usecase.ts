import { Inject, Injectable, Logger } from '@nestjs/common';
import { GenerateCourseDto } from '../dtos/generate-course.dto';
import { GenerateCourseUseCase } from './generate-course.usecase';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { GenerationEventsService } from '../services/generation-events.service';
import { GenerateLessonScriptUseCase } from './generate-lesson-script.usecase';
import { GenerateLessonStoryboardUseCase } from './generate-lesson-storyboard.usecase';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

interface CourseGenerationInput {
	jobId: string;
	userId: string;
	data: GenerateCourseDto;
	files: Express.Multer.File[];
}

@Injectable()
export class CourseGenerationOrchestratorUseCase {
	private readonly logger = new Logger(
		CourseGenerationOrchestratorUseCase.name
	);

	constructor(
		private readonly generateCourseUseCase: GenerateCourseUseCase,
		private readonly generateLessonScriptUseCase: GenerateLessonScriptUseCase,
		private readonly generateLessonStoryboardUseCase: GenerateLessonStoryboardUseCase,
		private readonly generationEventsService: GenerationEventsService,
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort
	) {}

	async run(input: CourseGenerationInput): Promise<void> {
		const auth = { userId: input.userId, role: 'authenticated' as const };

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

			await this.generationJobRepository.update(
				input.jobId,
				{
					courseId: savedCourse.id,
					phase: 'demo_script',
					progress: 30,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'structure',
					progress: 30,
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

			const fullCourse = await this.courseRepository.findById(
				savedCourse.id,
				auth
			);
			const firstModule = fullCourse?.modules?.[0];
			const firstLesson = firstModule?.lessons?.[0];

			if (!firstModule || !firstLesson) {
				throw new Error('Curso sem módulo/aula para gerar demo');
			}

			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'demo_script',
					progress: 35,
					courseId: savedCourse.id,
				}
			);

			const generatedScript = await this.generateLessonScriptUseCase.execute(
				{
					courseId: savedCourse.id,
					moduleId: firstModule.id,
					title: firstLesson.title,
					description: firstLesson.description ?? '',
					ai: {
						provider: 'openai',
					},
				},
				input.userId
			);

			await this.lessonRepository.update(
				firstLesson.id,
				{
					content: {
						...(firstLesson.content as Record<string, unknown>),
						scriptSections: generatedScript.scriptSections,
					},
				},
				auth
			);

			await this.generationJobRepository.update(
				input.jobId,
				{
					phase: 'demo_storyboard',
					progress: 65,
				},
				auth
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.completed',
				{
					phase: 'demo_script',
					progress: 65,
					courseId: savedCourse.id,
				}
			);
			this.generationEventsService.publish(
				input.jobId,
				'generation.phase.started',
				{
					phase: 'demo_storyboard',
					progress: 70,
					courseId: savedCourse.id,
				}
			);

			const storyboard = await this.generateLessonStoryboardUseCase.execute({
				courseId: savedCourse.id,
				moduleId: firstModule.id,
				lessonId: firstLesson.id,
				userId: input.userId,
			});

			await this.generationJobRepository.update(
				input.jobId,
				{
					status: 'completed',
					phase: 'done',
					progress: 100,
					metadata: {
						moduleId: firstModule.id,
						lessonId: firstLesson.id,
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
			});
		}
	}
}
