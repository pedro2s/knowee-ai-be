import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { Module } from '../entities/module.entity';
import { CreateModuleInput } from '../entities/module.types';
import { GeneratedModule } from '../entities/course.types';

export abstract class ModuleRepositoryPort {
	abstract create(module: Module, auth: AuthContext): Promise<Module>;
	abstract save(module: Module, auth: AuthContext): Promise<Module>;
	abstract findById(id: string, auth: AuthContext): Promise<Module | null>;
	abstract findAllByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<Module[]>;
	abstract update(
		id: string,
		values: Partial<CreateModuleInput>,
		auth: AuthContext
	): Promise<Module | null>;
	abstract delete(id: string, auth: AuthContext): Promise<Module | null>;
	abstract saveModuleTree(
		generatedCourse: GeneratedModule & { courseId: string },
		auth: AuthContext
	): Promise<Module>;
}
