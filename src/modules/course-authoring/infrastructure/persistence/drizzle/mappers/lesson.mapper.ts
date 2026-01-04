import { Lesson } from 'src/modules/course-authoring/domain/entities/lesson.entity';
import { SelectLesson } from 'src/shared/infrastructure/database/drizzle/schema';

export class LessonMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectLesson): Lesson {
		// ATENÇÃO: Ao restaurar no banco, assumimos que o dado já é válidado

		return Lesson.restore({
			id: raw.id,
			moduleId: raw.moduleId,
			courseId: raw.courseId,
			title: raw.title,
			description: raw.description,
			lessonType: raw.lessonType,
			content: raw.content,
			assets: raw.assets,
			orderIndex: raw.orderIndex,
			duration: raw.duration,
			isPublished: raw.isPublished,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
		});
	}

	/** Domínio -> Banco de Dados */
	static toPersistence(entity: Lesson): SelectLesson {
		// Usamos o método toPrimitives() que criamos na entidade
		const props = entity.toPrimitives();

		return {
			id: props.id,
			moduleId: props.moduleId,
			courseId: props.courseId,
			title: props.title,
			description: props.description,
			lessonType: props.lessonType,
			content: props.content,
			assets: props.assets,
			orderIndex: props.orderIndex,
			duration: props.duration,
			isPublished: props.isPublished,
			createdAt: props.createdAt.toISOString(),
			updatedAt: props.updatedAt.toISOString(),
		};
	}
}
