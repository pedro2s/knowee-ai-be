import { Inject, Injectable } from '@nestjs/common';
import {
	CreateCourseInput,
	GeneratedCourse,
} from 'src/modules/course-authoring/domain/entities/course.types';
import { Course } from 'src/modules/course-authoring/domain/entities/course.entity';
import { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';
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
				.insert(schema.courses)
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
				.insert(schema.courses)
				.values(data)
				.onConflictDoUpdate({ target: schema.courses.id, set: data })
				.returning();
			return CourseMapper.toDomain(newCourse);
		});
	}

	async findById(id: string, auth: AuthContext): Promise<Course | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const course = await tx.query.courses.findFirst({
				where: eq(schema.courses.id, id),
				with: {
					modules: {
						with: {
							lessons: true, // Carrega as lições para cada módulo
						},
					},
				},
			});
			return course ? CourseMapper.toDomain(course) : null;
		});
	}

	async findAllByUserId(userId: string): Promise<Course[]> {
		return this.dbContext.runAsUser(
			{ userId, role: 'authenticated' },
			async (db) => {
				const tx = db as DrizzleDB;
				const userCourses = await tx.query.courses.findMany({
					where: eq(schema.courses.userId, userId),
					with: {
						modules: {
							with: {
								lessons: true,
							},
						},
					},
				});
				return userCourses.map(CourseMapper.toDomain);
			},
		);
	}

	async update(
		id: string,
		values: Partial<CreateCourseInput>,
		auth: AuthContext,
	): Promise<Course | null> {
		return this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			const [updatedCourse] = await tx
				.update(schema.courses)
				.set(values)
				.where(eq(schema.courses.id, id))
				.returning();
			return updatedCourse ? CourseMapper.toDomain(updatedCourse) : null;
		});
	}

	async delete(id: string, auth: AuthContext): Promise<void> {
		await this.dbContext.runAsUser(auth, async (db) => {
			const tx = db as DrizzleDB;
			await tx.delete(schema.courses).where(eq(schema.courses.id, id));
		});
	}

	async saveCourseTree(
		generatedCourse: GeneratedCourse,
		userId: string,
	): Promise<Course> {
		return this.dbContext.runAsUser(
			{ userId, role: 'authenticated' },
			async (db) => {
				const tx = db as DrizzleDB;
				const [course] = await tx
					.insert(schema.courses)
					.values({
						...generatedCourse.course,
						userId,
					})
					.returning();

				const courseId = course.id;

				const [module] = await tx
					.insert(schema.modules)
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
					await tx.insert(schema.lessons).values(lessonsToInsert);
				}

				return CourseMapper.toDomain(course);
			},
		);
	}
}
