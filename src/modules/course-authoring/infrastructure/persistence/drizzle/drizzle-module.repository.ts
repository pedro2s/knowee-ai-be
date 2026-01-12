import { Inject, Injectable } from '@nestjs/common';
import { Module } from 'src/modules/course-authoring/domain/entities/module.entity';
import { CreateModuleInput } from 'src/modules/course-authoring/domain/entities/module.types';
import { ModuleRepositoryPort } from 'src/modules/course-authoring/domain/ports/module-repository.port';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/application/ports/db-context.port';
import { ModuleMapper } from './mappers/module.mapper';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/infrastructure/database/drizzle/schema';
import { asc, eq } from 'drizzle-orm';
import { GeneratedModule } from 'src/modules/course-authoring/domain/entities/course.types';
import { Lesson } from 'src/modules/course-authoring/domain/entities/lesson.entity';

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
			return courseModules.map((course) => ModuleMapper.toDomain(course));
		});
	}

	update(
		id: string,
		values: Partial<CreateModuleInput>,
		auth: AuthContext
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

	async saveModuleTree(
		generatedCourse: GeneratedModule & { courseId: string },
		auth: AuthContext
	): Promise<Module> {
		const { lessons, ...moduleData } = generatedCourse;

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const courseId = generatedCourse.courseId;

			const [module] = await tx
				.insert(schema.modules)
				.values({
					...moduleData,
					courseId: generatedCourse.courseId,
				})
				.returning();

			const moduleId = module.id;

			const lessonsToInsert = lessons.map((lesson) => ({
				moduleId,
				courseId,
				lessonType: 'article',
				title: lesson.title,
				content: lesson.content,
				orderIndex: lesson.orderIndex,
				description: lesson.description,
			}));

			let savedLessons: schema.SelectLesson[] | undefined;
			if (lessonsToInsert.length > 0) {
				savedLessons = await tx
					.insert(schema.lessons)
					.values(lessonsToInsert)
					.returning();
			}

			return ModuleMapper.toDomain({
				...module,
				lessons: savedLessons,
			});
		});
	}
}
