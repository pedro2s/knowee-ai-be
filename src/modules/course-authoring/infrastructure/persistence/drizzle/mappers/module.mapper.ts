import { Module } from 'src/modules/course-authoring/domain/entities/module.entity';
import { SelectModule } from 'src/shared/database/infrastructure/drizzle/schema';

export class ModuleMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectModule): Module {
		// ATENÇÃO: Ao restaurar no banco, assumimos que o dado já é válidado

		return Module.restore({
			id: raw.id,
			courseId: raw.courseId,
			title: raw.title,
			description: raw.description,
			orderIndex: raw.orderIndex,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
		});
	}

	/** Domínio -> Banco de Dados */
	static toPersistence(entity: Module): SelectModule {
		// Usamos o método toPrimitives() que criamos na entidade
		const props = entity.toPrimitives();

		return {
			id: props.id,
			courseId: props.courseId,
			title: props.title,
			description: props.description,
			orderIndex: props.orderIndex,
			createdAt: props.createdAt.toISOString(),
			updatedAt: props.updatedAt.toISOString(),
		};
	}
}
