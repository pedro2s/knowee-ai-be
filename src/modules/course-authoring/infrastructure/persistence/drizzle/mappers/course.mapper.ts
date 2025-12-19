import { Course } from 'src/modules/course-authoring/domain/entities/course.entity';
import { SelectCourse } from 'src/shared/database/infrastructure/drizzle/schema';

export class CourseMapper {
	/** Banco de Dados -> Domínio */
	static toDomain(raw: SelectCourse): Course {
		return Course.restore({
			id: raw.id,
			userId: raw.userId,
			title: raw.title,
			description: raw.description,
			category: raw.category,
			level: raw.level,
			duration: raw.duration,
			targetAudience: raw.targetAudience,
			objectives: raw.objectives,
			files: raw.files,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
		});
	}

	/** Domínio -> Banco de Dados */
	static toPersistence(entity: Course): SelectCourse {
		const props = entity.toPrimitives();

		return {
			id: props.id,
			userId: props.userId,
			title: props.title,
			description: props.description,
			category: props.category,
			level: props.level,
			duration: props.duration,
			targetAudience: props.targetAudience,
			objectives: props.objectives,
			files: props.files,
			createdAt: props.createdAt.toISOString(),
			updatedAt: props.updatedAt.toISOString(),
		};
	}
}
