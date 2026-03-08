import { Lesson } from '../../domain/entities/lesson.entity';
import type { LessonProps } from '../../domain/entities/lesson.types';

export class LessonResponseDto {
	public id: string;
	public title: string;
	public content: unknown;
	public moduleId: string;
	public courseId: string;
	public description: string | null;
	public lessonType: string;
	public assets: unknown;
	public orderIndex: number;
	public duration: number | null;
	public isPublished: boolean | null;
	public createdAt: string;
	public updatedAt: string;

	private constructor(props: LessonResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(
		entity: Lesson,
		options?: { content?: unknown }
	): LessonResponseDto {
		const primitives = entity.toPrimitives();
		return LessonResponseDto.fromPrimitives(primitives, options);
	}

	static fromPrimitives(
		primitives: LessonProps,
		options?: { content?: unknown }
	): LessonResponseDto {
		return new LessonResponseDto({
			id: primitives.id,
			title: primitives.title,
			content: options?.content ?? primitives.content,
			moduleId: primitives.moduleId,
			courseId: primitives.courseId,
			description: primitives.description,
			lessonType: primitives.lessonType,
			assets: primitives.assets,
			orderIndex: primitives.orderIndex,
			duration: primitives.duration,
			isPublished: primitives.isPublished,
			createdAt: primitives.createdAt.toISOString(),
			updatedAt: primitives.updatedAt.toISOString(),
		});
	}
}
