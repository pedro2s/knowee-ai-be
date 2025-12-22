import { Injectable } from '@nestjs/common';
import { HistorySummaryRepositoryPort } from 'src/modules/history/domain/ports/history-summary-repository.port';
import {
	AuthContext,
	type DbContext,
} from 'src/shared/database/application/ports/db-context.port';
import * as schema from 'src/shared/database/infrastructure/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { HistorySummaryMapper } from './mappers/history-summary.mapper';
import { HistorySummary } from 'src/modules/history/domain/entities/history-summary.entity';

type DrizzleDB = NodePgDatabase<typeof schema>;

@Injectable()
export class DrizzleHistorySummaryRepository implements HistorySummaryRepositoryPort {
	constructor(private readonly dbContext: DbContext) {}

	findSummary(
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

	async saveSummary(
		courseId: string,
		summary: string,
		context: AuthContext,
	): Promise<void> {
		await this.dbContext.runAsUser(context, async (db) => {
			const tx = db as DrizzleDB;
			await tx
				.insert(schema.historySummary)
				.values({
					userId: context.userId,
					courseId,
					summary,
				})
				.onConflictDoUpdate({
					target: [
						schema.historySummary.userId,
						schema.historySummary.courseId,
					],
					set: { summary },
				});
		});
	}
}
