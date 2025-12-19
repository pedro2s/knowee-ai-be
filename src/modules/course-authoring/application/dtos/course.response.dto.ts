import { Course } from '../../domain/entities/course.entity';

export class CourseResponseDto {
	// Definimos explicitamente o que é público
	id: string;
	title: string;
	slug: string;
	description: string | null;
	category: string | null;
	level: string | null;
	duration: string | null;
	targetAudience: string | null;
	createdAt: string; // Datas geralmente viram strings ISO no front
	updatedAt: string;

	constructor(props: CourseResponseDto) {
		Object.assign(this, props);
	}

	/** O Mapper da Camada de Apresentação */
	static fromDomain(entity: Course): CourseResponseDto {
		// Usamos o toPrimitives() ou acessamos os getters da entidade
		const primitives = entity.toPrimitives();

		return new CourseResponseDto({
			id: primitives.id,
			title: primitives.title,
			slug: entity.slug,
			description: primitives.description,
			category: primitives.category,
			level: primitives.level,
			duration: primitives.duration,
			targetAudience: primitives.targetAudience,
			createdAt: primitives.createdAt.toISOString(),
			updatedAt: primitives.updatedAt.toISOString(),
		});
	}
}
