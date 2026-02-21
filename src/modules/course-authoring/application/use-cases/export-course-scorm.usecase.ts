import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import {
	SCORM_PACKAGE_GENERATOR,
	type ScormPackageGeneratorPort,
	type ScormPackageGeneratorResult,
} from '../../domain/ports/scorm-package-generator.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import type { ScormCourseExportInput } from '../../domain/entities/scorm-export.types';
import type { ExportScormDto } from '../dtos/export-scorm.dto';

@Injectable()
export class ExportCourseScormUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(SCORM_PACKAGE_GENERATOR)
		private readonly scormPackageGenerator: ScormPackageGeneratorPort
	) {}

	async execute(
		courseId: string,
		userId: string,
		payload?: ExportScormDto
	): Promise<ScormPackageGeneratorResult> {
		void payload;
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const course = await this.courseRepository.findById(courseId, authContext);
		if (!course) {
			throw new NotFoundException('Curso não encontrado');
		}

		const primitive = course.toPrimitives();
		const input: ScormCourseExportInput = {
			id: primitive.id,
			title: primitive.title,
			description: primitive.description,
			category: primitive.category,
			level: primitive.level,
			duration: primitive.duration,
			targetAudience: primitive.targetAudience,
			objectives: primitive.objectives,
			modules: (primitive.modules || []).map((module) => ({
				id: module.id,
				title: module.title,
				description: module.description,
				orderIndex: module.orderIndex,
				lessons: (module.lessons || []).map((lesson) => {
					const content = this.getSafeContent(lesson.content);
					const lessonType = lesson.lessonType as
						| 'video'
						| 'audio'
						| 'quiz'
						| 'pdf'
						| 'external'
						| 'article';
					const resolvedMediaUrl =
						lessonType === 'video'
							? this.getString(content.finalVideoUrl)
							: lessonType === 'audio'
								? this.getString(content.audioUrl)
								: null;

					return {
						id: lesson.id,
						title: lesson.title,
						description: lesson.description,
						lessonType,
						duration: lesson.duration,
						content,
						resolvedMediaUrl,
						shouldUseVideoFallback: lessonType === 'video' && !resolvedMediaUrl,
					};
				}),
			})),
		};

		return this.scormPackageGenerator.generate(input);
	}

	private getSafeContent(value: unknown): Record<string, unknown> {
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return {};
	}

	private getString(value: unknown): string | null {
		return typeof value === 'string' && value.trim().length > 0 ? value : null;
	}
}
