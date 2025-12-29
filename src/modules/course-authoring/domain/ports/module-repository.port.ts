import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { Module } from '../entities/module.entity';
import { CreateModuleInput } from '../entities/module.types';

export const MODULE_REPOSITORY = 'MODULE_REPOSITORY';

export interface ModuleRepositoryPort {
	create(module: Module, auth: AuthContext): Promise<Module>;
	save(module: Module, auth: AuthContext): Promise<Module>;
	findById(id: string, auth: AuthContext): Promise<Module | null>;
	findAllByCourseId(courseId: string, auth: AuthContext): Promise<Module[]>;
	update(
		id: string,
		values: Partial<CreateModuleInput>,
		auth: AuthContext,
	): Promise<Module | null>;
	delete(id: string, auth: AuthContext): Promise<void>;
}
