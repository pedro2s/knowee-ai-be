import { Inject, Injectable } from '@nestjs/common';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/database/domain/ports/db-context.port';
import { and, eq, sql } from 'drizzle-orm';
import { HistoryRepositoryPort } from 'src/modules/history/domain/ports/history-repository.port';
import { History } from 'src/modules/history/domain/entities/history.entity';
import { HistoryMapper } from './mappers/history.mapper';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DrizzleDB = NodePgDatabase<typeof schema>;
@Injectable()
export class DrizzleHistoryRepository implements HistoryRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async findHistory(
		courseId: string,
		context: AuthContext
	): Promise<History[]> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			const result = await tx.query.history.findMany({
				where: and(
					eq(schema.history.userId, context.userId),
					eq(schema.history.courseId, courseId)
				),
				orderBy: (history, { asc }) => [asc(history.createdAt)],
			});

			return result.map((history) => HistoryMapper.toDomain(history));
		});
	}

	async findWindowHistory(
		courseId: string,
		windowSize: number,
		context: AuthContext
	): Promise<History[]> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			const result = await tx.query.history.findMany({
				where: and(
					eq(schema.history.userId, context.userId),
					eq(schema.history.courseId, courseId)
				),
				orderBy: (history, { desc }) => [desc(history.createdAt)],
				limit: windowSize,
			});

			return result.map((history) => HistoryMapper.toDomain(history)).reverse();
		});
	}

	async countMessages(courseId: string, context: AuthContext): Promise<number> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;
			const result = await tx
				.select({
					count: sql<number>`cast(count(${schema.history.id}) as int)`,
				})
				.from(schema.history)
				.where(
					and(
						eq(schema.history.userId, context.userId),
						eq(schema.history.courseId, courseId)
					)
				);
			return result[0].count;
		});
	}

	async saveHistory(history: History, context: AuthContext): Promise<void> {
		const persistence = HistoryMapper.toPersistence(history);
		await this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			await tx.insert(schema.history).values({
				userId: context.userId,
				courseId: persistence.courseId,
				message: persistence.message,
			});
		});
	}

	deleteHistory(courseId: string, context: AuthContext): Promise<void> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			await tx
				.delete(schema.history)
				.where(
					and(
						eq(schema.history.userId, context.userId),
						eq(schema.history.courseId, courseId)
					)
				);
		});
	}
}
