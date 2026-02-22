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
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import {
	STORYBOARD_GENERATOR,
	type StoryboardGeneratorPort,
	type Scene,
} from '../../domain/ports/storyboard-generator.port';
import { ScriptSection } from '../../domain/entities/lesson-script.types';

interface GenerateLessonStoryboardInput {
	courseId: string;
	moduleId: string;
	lessonId: string;
	userId: string;
}

interface GeneratedLessonStoryboardResult {
	courseId: string;
	moduleId: string;
	lessonId: string;
	totalSections: number;
	totalScenes: number;
}

@Injectable()
export class GenerateLessonStoryboardUseCase {
	constructor(
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(STORYBOARD_GENERATOR)
		private readonly storyboardGenerator: StoryboardGeneratorPort
	) {}

	async execute(
		input: GenerateLessonStoryboardInput
	): Promise<GeneratedLessonStoryboardResult> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const lesson = await this.lessonRepository.findById(input.lessonId, auth);
		if (!lesson) {
			throw new NotFoundException('Aula não encontrada');
		}

		const module = await this.moduleRepository.findById(input.moduleId, auth);
		if (!module) {
			throw new NotFoundException('Módulo não encontrado');
		}

		const course = await this.courseRepository.findById(input.courseId, auth);
		if (!course) {
			throw new NotFoundException('Curso não encontrado');
		}

		const currentContent =
			(lesson.content as { scriptSections?: ScriptSection[] }) ?? {};
		const scriptSections = currentContent.scriptSections ?? [];

		let totalScenes = 0;
		const sectionsWithStoryboard: ScriptSection[] = [];

		for (const section of scriptSections) {
			const { storyboard } = await this.storyboardGenerator.generate({
				course: {
					title: course.title,
					description: course.description ?? '',
				},
				module: {
					title: module.title,
					description: module.description ?? '',
				},
				lesson: {
					title: lesson.title,
					description: lesson.description ?? '',
				},
				script: section.content,
			});

			totalScenes += storyboard.length;
			sectionsWithStoryboard.push({
				...section,
				storyboard: storyboard as unknown as Scene[],
			});
		}

		await this.lessonRepository.update(
			lesson.id,
			{
				content: {
					...(lesson.content as Record<string, unknown>),
					scriptSections: sectionsWithStoryboard,
				},
			},
			auth
		);

		return {
			courseId: input.courseId,
			moduleId: input.moduleId,
			lessonId: input.lessonId,
			totalSections: scriptSections.length,
			totalScenes,
		};
	}
}
