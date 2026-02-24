import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import {
	courses,
	lessons,
	modules,
	subscribers,
	tokenUsage,
} from 'src/shared/database/infrastructure/drizzle/schema';
import {
	AccessControlRepositoryPort,
	SubscriberSnapshot,
} from '../../../domain/ports/access-control.repository.port';

@Injectable()
export class DrizzleAccessControlRepository implements AccessControlRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	async getLatestSubscriber(
		userId: string
	): Promise<SubscriberSnapshot | null> {
		const row = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			with: { subscriptionTier: true },
			orderBy: [desc(subscribers.createdAt)],
		});

		if (!row) {
			return null;
		}

		return {
			id: row.id,
			createdAt: row.createdAt,
			subscribed: row.subscribed,
			tierName: row.subscriptionTier?.name ?? null,
			monthlyTokenLimit: row.subscriptionTier?.monthlyTokenLimit ?? null,
			sampleCourseId: row.sampleCourseId,
			sampleConsumedAt: row.sampleConsumedAt,
			sampleGenerationCount: row.sampleGenerationCount,
		};
	}

	async countUserCourses(userId: string): Promise<number> {
		const result = await this.drizzle.db
			.select({ count: sql<number>`count(*)` })
			.from(courses)
			.where(eq(courses.userId, userId));

		return Number(result[0]?.count ?? 0);
	}

	async getFirstCourseId(userId: string): Promise<string | null> {
		const result = await this.drizzle.db
			.select({ id: courses.id })
			.from(courses)
			.where(eq(courses.userId, userId))
			.orderBy(asc(courses.createdAt))
			.limit(1);

		return result[0]?.id ?? null;
	}

	async getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDateIso: string
	): Promise<number> {
		const result = await this.drizzle.db
			.select({ sum: sql<number>`coalesce(sum(${tokenUsage.totalTokens}), 0)` })
			.from(tokenUsage)
			.where(
				and(
					eq(tokenUsage.userId, userId),
					eq(tokenUsage.subscriptionId, subscriptionId),
					gte(tokenUsage.createdAt, startDateIso)
				)
			);

		return Number(result[0]?.sum ?? 0);
	}

	async getFirstModuleId(
		courseId: string,
		userId: string
	): Promise<string | null> {
		const row = await this.drizzle.db
			.select({ id: modules.id })
			.from(modules)
			.innerJoin(courses, eq(courses.id, modules.courseId))
			.where(and(eq(modules.courseId, courseId), eq(courses.userId, userId)))
			.orderBy(asc(modules.orderIndex))
			.limit(1);

		return row[0]?.id ?? null;
	}

	async getFirstLessonId(
		moduleId: string,
		userId: string
	): Promise<string | null> {
		const row = await this.drizzle.db
			.select({ id: lessons.id })
			.from(lessons)
			.innerJoin(courses, eq(courses.id, lessons.courseId))
			.where(and(eq(lessons.moduleId, moduleId), eq(courses.userId, userId)))
			.orderBy(asc(lessons.orderIndex))
			.limit(1);

		return row[0]?.id ?? null;
	}

	async getCourseIdByModuleId(
		moduleId: string,
		userId: string
	): Promise<string | null> {
		const row = await this.drizzle.db
			.select({ courseId: modules.courseId })
			.from(modules)
			.innerJoin(courses, eq(courses.id, modules.courseId))
			.where(and(eq(modules.id, moduleId), eq(courses.userId, userId)))
			.limit(1);

		return row[0]?.courseId ?? null;
	}

	async getLessonScopeByLessonId(
		lessonId: string,
		userId: string
	): Promise<{ courseId: string; moduleId: string } | null> {
		const row = await this.drizzle.db
			.select({ courseId: lessons.courseId, moduleId: lessons.moduleId })
			.from(lessons)
			.innerJoin(courses, eq(courses.id, lessons.courseId))
			.where(and(eq(lessons.id, lessonId), eq(courses.userId, userId)))
			.limit(1);

		if (!row[0]) {
			return null;
		}

		return {
			courseId: row[0].courseId,
			moduleId: row[0].moduleId,
		};
	}

	async markSampleConsumed(
		userId: string,
		sampleCourseId: string
	): Promise<void> {
		const current = await this.drizzle.db.query.subscribers.findFirst({
			where: eq(subscribers.userId, userId),
			columns: { id: true, sampleCourseId: true, sampleGenerationCount: true },
		});

		if (!current) {
			return;
		}

		if (current.sampleCourseId) {
			return;
		}

		await this.drizzle.db
			.update(subscribers)
			.set({
				sampleCourseId,
				sampleConsumedAt: new Date().toISOString(),
				sampleGenerationCount: (current.sampleGenerationCount ?? 0) + 1,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(subscribers.id, current.id));
	}
}
