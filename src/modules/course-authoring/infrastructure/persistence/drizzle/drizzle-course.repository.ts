import { Inject, Injectable } from '@nestjs/common';
import {
	CreateCourseInput,
	GeneratedCourse,
} from 'src/modules/course-authoring/domain/entities/course.types';
import { Course } from 'src/modules/course-authoring/domain/entities/course.entity';
import { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';
import {
	courses,
	lessons,
	modules,
} from 'src/shared/database/infrastructure/drizzle/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
	DB_CONTEXT,
	type AuthContext,
	type DbContext,
} from 'src/shared/database/application/ports/db-context.port';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { CourseMapper } from './mappers/course.mapper';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleCourseRepository implements CourseRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async create(course: Course, auth: AuthContext): Promise<Course> {
		// Domínio -> Mapper -> Schema Drizzle
		const data = CourseMapper.toPersistence(course);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newCourse] = await tx
				.insert(courses)
				.values(data)
				.returning();
			return CourseMapper.toDomain(newCourse);
		});
	}

	async save(course: Course, auth: AuthContext): Promise<Course> {
		// Domínio -> Mapper -> Schema Drizzle
		const data = CourseMapper.toPersistence(course);

		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [newCourse] = await tx
				.insert(courses)
				.values(data)
				.onConflictDoUpdate({ target: schema.courses.id, set: data })
				.returning();
			return CourseMapper.toDomain(newCourse);
		});
	}

	async findById(id: string, auth: AuthContext): Promise<Course | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [course] = await tx
				.select()
				.from(courses)
				.where(eq(courses.id, id));
			return course ? CourseMapper.toDomain(course) : null;
		});
	}

	async findAllByUserId(userId: string): Promise<Course[]> {
		return this.dbContext.runAsUser(
			{ userId, role: 'authenticated' },
			async (db) => {
				const tx = db as DrizzleDB;
				// const userCourses = await tx.query.courses.findMany({
				// 	where: eq(courses.userId, userId),
				// 	with: {
				// 		modules: {
				// 			with: {
				// 				lessons: true,
				// 			},
				// 		},
				// 	},
				// });
				// console.log('userCourses:', userCourses);

				const userCourses = await tx
					.select()
					.from(courses)
					.where(eq(courses.userId, userId));
				return userCourses.map(CourseMapper.toDomain);
			},
		);
	}

	async update(
		id: string,
		course: Partial<CreateCourseInput>,
		auth: AuthContext,
	): Promise<Course | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [updatedCourse] = await tx
				.update(courses)
				.set(course)
				.where(eq(courses.id, id))
				.returning();
			return updatedCourse ? CourseMapper.toDomain(updatedCourse) : null;
		});
	}

	async delete(id: string, auth: AuthContext): Promise<void> {
		await this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			await tx.delete(courses).where(eq(courses.id, id));
		});
	}

	async saveCourseTree(
		generatedCourse: GeneratedCourse,
		userId: string,
	): Promise<void> {
		await this.dbContext.runAsUser(
			{ userId, role: 'authenticated' },
			async (db) => {
				const tx = db as DrizzleDB;
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

				const lessonsToInsert = generatedCourse.lessons.map(
					(lesson) => ({
						id: uuidv4(),
						moduleId,
						courseId,
						lessonType: 'article',
						title: lesson.title,
						content: lesson.content,
						orderIndex: lesson.order,
					}),
				);

				if (lessonsToInsert.length > 0) {
					await tx.insert(lessons).values(lessonsToInsert);
				}
			},
		);
	}
}
