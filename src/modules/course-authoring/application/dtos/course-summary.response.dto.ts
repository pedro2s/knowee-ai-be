import { Course } from '../../domain/entities/course.entity';

export class CourseSummaryResponseDto {
	// Definimos explicitamente o que é público
	id: string;
	title: string;
	slug: string;
	description: string | null;
	category: string | null;
	level: string | null;
	duration: string | null;
	modulesQty: number;
	createdAt: string;

	constructor(props: CourseSummaryResponseDto) {
		Object.assign(this, props);
	}

	/** O Mapper da Camada de Apresentação */
	static fromDomain(entity: Course): CourseSummaryResponseDto {
		// Usamos o toPrimitives() ou acessamos os getters da entidade
		const primitives = entity.toPrimitives();

		return new CourseSummaryResponseDto({
			id: primitives.id,
			title: primitives.title,
			slug: entity.slug,
			description: primitives.description,
			category: primitives.category,
			level: primitives.level,
			duration: primitives.duration,
			createdAt: primitives.createdAt.toISOString(),
			modulesQty: primitives.modules?.length || 0,
		});
	}
}
