import { Injectable } from '@nestjs/common';
import {
	Course,
	CreateCouseInput,
	GeneratedCourse,
} from 'src/modules/course-authoring/domain/entities/course.entity';
import { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import {
	courses,
	lessons,
	modules,
} from 'src/shared/database/infrastructure/drizzle/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export type SelectCourse = typeof courses.$inferSelect;

@Injectable()
export class DrizzleCourseRepository implements CourseRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	private toCourse(dbCourse: SelectCourse): Course {
		return {
			id: dbCourse.id,
			title: dbCourse.title,
			description: dbCourse.description,
			category: dbCourse.category,
			level: dbCourse.level,
			duration: dbCourse.duration,
			targetAudience: dbCourse.targetAudience,
			userId: dbCourse.userId,
			createdAt: new Date(dbCourse.createdAt),
			updatedAt: new Date(dbCourse.updatedAt),
		};
	}

	async create(course: CreateCouseInput): Promise<Course> {
		const [newCourse] = await this.drizzle.db
			.insert(courses)
			.values(course)
			.returning();
		return this.toCourse(newCourse);
	}

	async findById(id: string): Promise<Course | null> {
		const [course] = await this.drizzle.db
			.select()
			.from(courses)
			.where(eq(courses.id, id));
		return course ? this.toCourse(course) : null;
	}

	async findAllByUserId(userId: string): Promise<Course[]> {
		const userCourses = await this.drizzle.db
			.select()
			.from(courses)
			.where(eq(courses.userId, userId));
		return userCourses.map(this.toCourse);
	}

	async update(
		id: string,
		course: Partial<CreateCouseInput>,
	): Promise<Course | null> {
		const [updatedCourse] = await this.drizzle.db
			.update(courses)
			.set(course)
			.where(eq(courses.id, id))
			.returning();
		return updatedCourse ? this.toCourse(updatedCourse) : null;
	}

	async delete(id: string): Promise<void> {
		await this.drizzle.db.delete(courses).where(eq(courses.id, id));
	}

	async saveCourseTree(
		generatedCourse: GeneratedCourse,
		userId: string,
	): Promise<void> {
		await this.drizzle.db.transaction(async (tx) => {
			const [course] = await tx
				.insert(courses)
				.values({
					...generatedCourse.course,
					userId,
				})
				.returning();

			const courseId = course.id;

			const [module] = await tx
				.insert(modules)
				.values({
					id: uuidv4(),
					courseId,
					title: 'Módulo 1',
				})
				.returning();

			const moduleId = module.id;

			const lessonsToInsert = generatedCourse.lessons.map((lesson) => ({
				id: uuidv4(),
				moduleId,
				courseId,
				lessonType: 'article',
				title: lesson.title,
				content: lesson.content,
				orderIndex: lesson.order,
			}));

			if (lessonsToInsert.length > 0) {
				await tx.insert(lessons).values(lessonsToInsert);
			}
		});
	}
}
