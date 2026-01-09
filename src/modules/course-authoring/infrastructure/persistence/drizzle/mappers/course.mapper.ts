import { Course } from 'src/modules/course-authoring/domain/entities/course.entity';
import { CourseTitle } from 'src/modules/course-authoring/domain/value-objects/course-title.vo';
import {
	SelectCourse,
	SelectLesson,
	SelectModule,
} from 'src/shared/infrastructure/database/drizzle/schema';
import { ModuleMapper } from './module.mapper';

// Tipo para o módulo bruto do Drizzle quando inclui lições
type SelectModuleWithLessons = SelectModule & {
	lessons?: SelectLesson[];
};

// Tipo para o curso bruto do Drizzle quando inclui módulos (com suas lições)
type SelectCourseWithModules = SelectCourse & {
	modules?: SelectModuleWithLessons[];
};

export class CourseMapper {
	/** Banco de Dados -> Domínio (Entity + VOs) */
	static toDomain(raw: SelectCourseWithModules): Course {
		// ATENÇÃO: Ao restaurar do banco, assumimos que o dado já é válidado.
		// Usamos o create() do VO para garantir que a integridade se mantém.
		// Se o banco tiver dados sujos (legado), isso pode lançar erro.
		const titleVO = CourseTitle.create(raw.title);

		// Mapeia os módulos, se existirem, usando o ModuleMapper atualizado
		const modules = raw.modules
			? raw.modules.map((module) => ModuleMapper.toDomain(module))
			: undefined;

		return Course.restore({
			id: raw.id,
			userId: raw.userId,
			title: titleVO,
			description: raw.description,
			category: raw.category,
			level: raw.level,
			duration: raw.duration,
			targetAudience: raw.targetAudience,
			objectives: raw.objectives,
			files: raw.files,
			createdAt: new Date(raw.createdAt),
			updatedAt: new Date(raw.updatedAt),
			modules, // Passa os módulos mapeados para a entidade de domínio
		});
	}

	/** Domínio -> Banco de Dados */
	static toPersistence(entity: Course): SelectCourse {
		// Usamos o método toPrimitives() que criamos na entidade para facilitar
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
