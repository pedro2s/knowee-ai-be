import { Module } from '../../domain/entities/module.entity';

export class ModuleResponseDto {
	// Definimos explicitamente o que é público
	id: string;
	title: string;
	description: string | null;
	orderIndex: number;
	createdAt: string; // Datas geralmente viram strings ISO no front
	updatedAt: string;

	lessons?: Array<{
		id: string;
		title: string;
		orderIndex: number;
		description: string | null;
		content: unknown;
		createdAt: string;
		updatedAt: string;
	}>;

	constructor(props: ModuleResponseDto) {
		Object.assign(this, props);
	}

	/** O Mapper da Camada de Apresentação */
	static fromDomain(entity: Module): ModuleResponseDto {
		// Usamos o toPrimitives() ou acessamos os getters da entidade
		const primitives = entity.toPrimitives();

		return new ModuleResponseDto({
			id: primitives.id,
			title: primitives.title,
			description: primitives.description,
			orderIndex: primitives.orderIndex,
			createdAt: primitives.createdAt.toISOString(),
			updatedAt: primitives.updatedAt.toISOString(),
			lessons: primitives?.lessons?.map((lesson) => ({
				...lesson,
				createdAt: lesson.createdAt.toISOString(),
				updatedAt: lesson.updatedAt.toISOString(),
			})),
		});
	}
}
