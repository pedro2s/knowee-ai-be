import { Injectable } from '@nestjs/common';
import { and, eq, gte, sql } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/infrastructure/database/drizzle/drizzle.service';
import {
	subscribers,
	tokenUsage,
} from 'src/shared/infrastructure/database/drizzle/schema';
import type { UsageRepositoryPort } from '../../../domain/ports/usage-repository.port';

@Injectable()
export class DrizzleUsageRepository implements UsageRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	async getActiveSubscription(userId: string): Promise<{
		id: string;
		createdAt: string;
	} | null> {
		const result = await this.drizzle.db.query.subscribers.findFirst({
			where: and(
				eq(subscribers.userId, userId),
				eq(subscribers.subscribed, true)
			),
			columns: {
				id: true,
				createdAt: true,
			},
		});

		return result || null;
	}

	async getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDate: Date
	): Promise<number> {
		const result = await this.drizzle.db
			.select({
				sum: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)`,
			})
			.from(tokenUsage)
			.where(
				and(
					eq(tokenUsage.userId, userId),
					eq(tokenUsage.subscriptionId, subscriptionId),
					gte(tokenUsage.createdAt, startDate.toISOString())
				)
			);

		return result[0]?.sum || 0;
	}
}
