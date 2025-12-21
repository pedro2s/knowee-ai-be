import { Inject, Injectable } from '@nestjs/common';
import {
	AuthContext,
	DB_CONTEXT,
	DbContext,
} from '@shared/database/application/ports/db-context.port';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
	history,
	historySummary,
} from '@shared/database/infrastructure/drizzle/schema';
import {
	HISTORY_REPOSITORY,
	HistoryRepository,
} from '@history/domain/ports/history.repository.port';
import { HistoryMessageEntity } from '@history/domain/entities/history-message.entity';
import { HistoryMapper } from './mappers/history.mapper';

@Injectable()
export class DrizzleHistoryRepository implements HistoryRepository {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async findWindowMessages(
		context: AuthContext,
		courseId: string,
		windowSize: number,
	): Promise<HistoryMessageEntity[]> {
		const result = await this.dbContext.runAsUser(context, (db) =>
			db
				.select()
				.from(history)
				.where(
					and(
						eq(history.userId, context.userId),
						eq(history.courseId, courseId),
					),
				)
				.orderBy(desc(history.createdAt))
				.limit(windowSize),
		);

		return result.map(HistoryMapper.toEntity).reverse();
	}

	async findSummary(
		context: AuthContext,
		courseId: string,
	): Promise<{ summary: string | null }> {
		const result = await this.dbContext.runAsUser(context, (db) =>
			db
				.select()
				.from(historySummary)
				.where(
					and(
						eq(historySummary.userId, context.userId),
						eq(historySummary.courseId, courseId),
					),
				)
				.limit(1),
		);

		if (result.length === 0) {
			return { summary: null };
		}

		return { summary: result[0].summary };
	}

	async countMessages(
		context: AuthContext,
		courseId: string,
	): Promise<number> {
		const result = await this.dbContext.runAsUser(context, (db) =>
			db
				.select({
					count: sql<number>`cast(count(${history.id}) as int)`,
				})
				.from(history)
				.where(
					and(
						eq(history.userId, context.userId),
						eq(history.courseId, courseId),
					),
				),
		);

		return result[0].count;
	}

	async saveMessage(
		context: AuthContext,
		courseId: string,
		message: HistoryMessageEntity,
	): Promise<void> {
		const persistence = HistoryMapper.toPersistence(message);
		await this.dbContext.runAsUser(context, (db) =>
			db.insert(history).values({
				userId: context.userId,
				courseId,
				message: persistence.message,
			}),
		);
	}

	async saveSummary(
		context: AuthContext,
		courseId: string,
		summary: string,
	): Promise<void> {
		await this.dbContext.runAsUser(context, (db) =>
			db
				.insert(historySummary)
				.values({
					userId: context.userId,
					courseId,
					summary,
				})
				.onConflictDoUpdate({
					target: [historySummary.userId, historySummary.courseId],
					set: { summary },
				}),
		);
	}
}
