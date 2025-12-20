import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Lesson } from 'src/modules/course-authoring/domain/entities/lesson.entity';
import { LessonRepositoryPort } from 'src/modules/course-authoring/domain/ports/lesson-repository.port';
import { CreateLessonInput } from 'src/modules/course-authoring/domain/entities/lesson.types';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/database/application/ports/db-context.port';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { LessonMapper } from './mappers/lesson.mapper';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleLessonRepository implements LessonRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	create(lesson: Lesson, auth: AuthContext): Promise<Lesson> {
		// Domínio -> Mapper -> Schema Drizzle
		const data = LessonMapper.toPersistence(lesson);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newLesson] = await tx
				.insert(schema.lessons)
				.values(data)
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return LessonMapper.toDomain(newLesson);
		});
	}

	findById(id: string, auth: AuthContext): Promise<Lesson | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [lesson] = await tx
				.select()
				.from(schema.lessons)
				.where(eq(schema.lessons.id, id));

			// Schema Drizzle -> Mapper -> Domínio
			return lesson ? LessonMapper.toDomain(lesson) : null;
		});
	}

	findAllByModuleId(moduleId: string, auth: AuthContext): Promise<Lesson[]> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const moduleLessons = await tx
				.select()
				.from(schema.lessons)
				.where(eq(schema.lessons.moduleId, moduleId));

			// Schema Drizzle -> Mapper -> Domínio
			return moduleLessons.map(LessonMapper.toDomain);
		});
	}

	update(
		id: string,
		lesson: Partial<CreateLessonInput>,
		auth: AuthContext,
	): Promise<Lesson | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [updatedLesson] = await tx
				.update(schema.lessons)
				.set(lesson)
				.where(eq(schema.lessons.id, id))
				.returning();

			// Schema Drizzle -> Mapper -> Domínio
			return updatedLesson ? LessonMapper.toDomain(updatedLesson) : null;
		});
	}

	delete(id: string, auth: AuthContext): Promise<void> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			await tx.delete(schema.lessons).where(eq(schema.lessons.id, id));
		});
	}
}
