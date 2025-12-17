import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/drizzle/drizzle.service';
import { Lesson } from 'src/modules/course-authoring/domain/entities/lesson.entity';
import { LessonRepositoryPort } from 'src/modules/course-authoring/domain/ports/lesson-repository.port';
import { lessons } from 'src/shared/database/drizzle/schema';

type LessonSchema = typeof lessons.$inferSelect;

@Injectable()
export class DrizzleLessonRepository implements LessonRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	private toDomain(data: LessonSchema): Lesson {
		const lesson = new Lesson(
			data.id,
			data.moduleId,
			data.title,
			data.description,
			data.lessonType,
			data.content,
			data.assets,
			data.orderIndex,
			data.duration,
			new Date(data.createdAt),
			new Date(data.updatedAt),
		);

		return lesson;
	}

	private toPersistence(
		data: Partial<Lesson>,
	): Omit<typeof lessons.$inferInsert, 'id' | 'createdAt' | 'updatedAt'> {
		const persistenceData: any = {
			title: data.title,
			moduleId: data.moduleId,
			orderIndex: data.orderIndex,
			content: JSON.stringify(data.content || {}),
		};

		return persistenceData;
	}

	async create(domainLesson: Lesson): Promise<Lesson> {
		const persistenceData = {
			...this.toPersistence(domainLesson),
			id: domainLesson.id,
		};

		const [newLesson] = await this.drizzle.db
			.insert(lessons)
			.values(persistenceData)
			.returning();

		return this.toDomain(newLesson);
	}

	async findById(id: string): Promise<Lesson | null> {
		const lessonData = await this.drizzle.db.query.lessons.findFirst({
			where: eq(lessons.id, id),
		});

		if (!lessonData) return null;
		return this.toDomain(lessonData);
	}

	async findAllByModuleId(moduleId: string): Promise<Lesson[]> {
		const result = await this.drizzle.db.query.lessons.findMany({
			where: eq(lessons.moduleId, moduleId),
		});
		return result.map((l) => this.toDomain(l));
	}

	async update(
		id: string,
		domainLessonPartial: Partial<Lesson>,
	): Promise<Lesson | null> {
		const persistenceData = this.toPersistence(domainLessonPartial);

		const [updatedLesson] = await this.drizzle.db
			.update(lessons)
			.set({ ...persistenceData, updatedAt: new Date().toISOString() })
			.where(eq(lessons.id, id))
			.returning();

		if (!updatedLesson) return null;
		return this.toDomain(updatedLesson);
	}

	async delete(id: string): Promise<void> {
		await this.drizzle.db.delete(lessons).where(eq(lessons.id, id));
	}
}
