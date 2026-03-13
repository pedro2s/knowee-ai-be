import {
	Inject,
	Injectable,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import {
	SCORM_PACKAGE_GENERATOR,
	type ScormPackageGeneratorPort,
	type ScormPackageGeneratorResult,
} from '../../domain/ports/scorm-package-generator.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import type { ScormCourseExportInput } from '../../domain/entities/scorm-export.types';
import type { ExportScormDto } from '../dtos/export-scorm.dto';
import {
	AssetBlockingIssue,
	evaluateLessonExportReadiness,
	getSafeLessonContent,
} from '../services/asset-export-readiness';

@Injectable()
export class ExportCourseScormUseCase {
	constructor(
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
		const blockingIssues = this.getBlockingIssues(primitive.modules || []);
		if (blockingIssues.length > 0) {
			throw new PreconditionFailedException(
				this.buildBlockingExportMessage(blockingIssues)
			);
		}

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
							? this.getString(content.finalVideoPath)
							: lessonType === 'audio'
								? this.getString(content.audioPath)
								: lessonType === 'pdf'
									? this.getString(content.pdfPath)
									: null;

					return {
						id: lesson.id,
						title: lesson.title,
						description: lesson.description,
						lessonType,
						duration: lesson.duration,
						content,
						mediaSourcePath: resolvedMediaUrl,
						shouldUseVideoFallback: false,
					};
				}),
			})),
		};

		return this.scormPackageGenerator.generate(input);
	}

	private getSafeContent(value: unknown): Record<string, unknown> {
		return getSafeLessonContent(value);
	}

	private getString(value: unknown): string | null {
		return typeof value === 'string' && value.trim().length > 0 ? value : null;
	}

	private getBlockingIssues(
		modules: Array<{
			lessons?: Array<{
				id: string;
				title: string;
				lessonType: string;
				content: unknown;
			}>;
		}>
	): AssetBlockingIssue[] {
		return modules.flatMap((module) =>
			(module.lessons || []).flatMap(
				(lesson) =>
					evaluateLessonExportReadiness({
						lessonId: lesson.id,
						lessonType: lesson.lessonType,
						content: lesson.content,
					}).blockingIssues
			)
		);
	}

	private buildBlockingExportMessage(
		blockingIssues: AssetBlockingIssue[]
	): string {
		if (blockingIssues.length === 1) {
			return blockingIssues[0].message;
		}

		return `${blockingIssues.length} pendencia(s) impedem a exportacao SCORM: ${blockingIssues
			.slice(0, 3)
			.map((issue) => issue.message)
			.join(' ')}`;
	}
}
