import { Module } from 'src/modules/course-authoring/domain/entities/module.entity';
import {
	SelectLesson,
	SelectModule,
} from 'src/shared/infrastructure/database/drizzle/schema';
import { LessonMapper } from './lesson.mapper';

// Tipo para o dado bruto do Drizzle quando inclui lições
type SelectModuleWithLessons = SelectModule & {
	lessons?: SelectLesson[];
};

export class ModuleMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectModuleWithLessons): Module {
		// ATENÇÃO: Ao restaurar no banco, assumimos que o dado já é válidado

		// Mapeia as lições, se existirem
		const lessons = raw.lessons
			? raw.lessons.map((lesson) => LessonMapper.toDomain(lesson))
			: undefined;

		return Module.restore({
			id: raw.id,
			courseId: raw.courseId,
			title: raw.title,
			description: raw.description,
			orderIndex: raw.orderIndex,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
			lessons, // Passa as lições mapeadas para a entidade de domínio
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
