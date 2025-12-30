import { Inject, Injectable } from '@nestjs/common';
import { Module } from 'src/modules/course-authoring/domain/entities/module.entity';
import { CreateModuleInput } from 'src/modules/course-authoring/domain/entities/module.types';
import { ModuleRepositoryPort } from 'src/modules/course-authoring/domain/ports/module-repository.port';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/database/application/ports/db-context.port';
import { ModuleMapper } from './mappers/module.mapper';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { asc, eq } from 'drizzle-orm';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleModuleRepository implements ModuleRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	create(module: Module, auth: AuthContext): Promise<Module> {
		// Domínio -> Mapper -> Schema Drizzle
		const data = ModuleMapper.toPersistence(module);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newModule] = await tx
				.insert(schema.modules)
				.values(data)
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return ModuleMapper.toDomain(newModule);
		});
	}

	save(module: Module, auth: AuthContext): Promise<Module> {
		// Domínio -> Mapper -> Schema Drizzle
		const data = ModuleMapper.toPersistence(module);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newModule] = await tx
				.insert(schema.modules)
				.values(data)
				.onConflictDoUpdate({
					target: schema.modules.id,
					set: data,
				})
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return ModuleMapper.toDomain(newModule);
		});
	}

	findById(id: string, auth: AuthContext): Promise<Module | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [module] = await tx
				.select()
				.from(schema.modules)
				.where(eq(schema.modules.id, id));

			// Schema Drizzle -> Mapper -> Domínio
			return module ? ModuleMapper.toDomain(module) : null;
		});
	}

	findAllByCourseId(courseId: string, auth: AuthContext): Promise<Module[]> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const courseModules = await tx
				.select()
				.from(schema.modules)
				.where(eq(schema.modules.courseId, courseId))
				.orderBy(asc(schema.modules.orderIndex));

			// Schema Drizzle -> Mapper -> Domínio
			return courseModules.map(ModuleMapper.toDomain);
		});
	}

	update(
		id: string,
		values: Partial<CreateModuleInput>,
		auth: AuthContext,
	): Promise<Module | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [updatedModule] = await tx
				.update(schema.modules)
				.set(values)
				.where(eq(schema.modules.id, id))
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return updatedModule ? ModuleMapper.toDomain(updatedModule) : null;
		});
	}

	delete(id: string, auth: AuthContext): Promise<Module | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [deletedModule] = await tx
				.delete(schema.modules)
				.where(eq(schema.modules.id, id))
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return deletedModule ? ModuleMapper.toDomain(deletedModule) : null;
		});
	}
}
