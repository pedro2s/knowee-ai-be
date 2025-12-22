import { Inject, Injectable } from '@nestjs/common';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/database/application/ports/db-context.port';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
	history,
	historySummary,
} from 'src/shared/database/infrastructure/drizzle/schema';
import { HistoryRepositoryPort } from 'src/modules/history/domain/ports/history-repository.port';
import { History } from 'src/modules/history/domain/entities/history.entity';
import { HistoryMapper } from './mappers/history.mapper';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DrizzleDB = NodePgDatabase<typeof schema>;
@Injectable()
export class DrizzleHistoryRepository implements HistoryRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	async findWindowMessages(
		courseId: string,
		windowSize: number,
		context: AuthContext,
	): Promise<History[]> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			const result = await tx.query.history.findMany({
				where: and(
					eq(schema.history.userId, context.userId),
					eq(schema.history.courseId, courseId),
				),
				orderBy: (history, { desc }) => [desc(history.createdAt)],
				limit: windowSize,
			});

			return result.map(HistoryMapper.toDomain).reverse();
		});
	}

	async countMessages(
		courseId: string,
		context: AuthContext,
	): Promise<number> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;
			const result = await tx
				.select({
					count: sql<number>`cast(count(${history.id}) as int)`,
				})
				.from(history)
				.where(
					and(
						eq(history.userId, context.userId),
						eq(history.courseId, courseId),
					),
				);
			return result[0].count;
		});
	}

	async saveMessage(
		courseId: string,
		message: History,
		context: AuthContext,
	): Promise<void> {
		const persistence = HistoryMapper.toPersistence(message);
		await this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;

			await tx.insert(history).values({
				userId: context.userId,
				courseId,
				message: persistence.message,
			});
		});
	}
}
