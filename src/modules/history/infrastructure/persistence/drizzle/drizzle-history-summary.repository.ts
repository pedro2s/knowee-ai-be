import { Inject, Injectable } from '@nestjs/common';
import { HistorySummaryRepositoryPort } from 'src/modules/history/domain/ports/history-summary-repository.port';
import {
	AuthContext,
	DB_CONTEXT,
	type DbContext,
} from 'src/shared/application/ports/db-context.port';
import * as schema from 'src/shared/infrastructure/database/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { HistorySummaryMapper } from './mappers/history-summary.mapper';
import { HistorySummary } from 'src/modules/history/domain/entities/history-summary.entity';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleHistorySummaryRepository implements HistorySummaryRepositoryPort {
	constructor(@Inject(DB_CONTEXT) private readonly dbContext: DbContext) {}

	findHistorySummary(
		courseId: string,
		context: AuthContext,
	): Promise<HistorySummary | null> {
		return this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;
			const [historySummary] = await tx
				.select()
				.from(schema.historySummary)
				.where(
					and(
						eq(schema.historySummary.userId, context.userId),
						eq(schema.historySummary.courseId, courseId),
					),
				);

			return historySummary
				? HistorySummaryMapper.toDomain(historySummary)
				: null;
		});
	}

	async saveHistorySummary(
		historySummary: HistorySummary,
		context: AuthContext,
	): Promise<void> {
		const data = HistorySummaryMapper.toPersistence(historySummary);

		await this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;
			await tx
				.insert(schema.historySummary)
				.values(data)
				.onConflictDoUpdate({
					target: [
						schema.historySummary.userId,
						schema.historySummary.courseId,
					],
					set: { summary: data.summary },
				});
		});
	}
}
