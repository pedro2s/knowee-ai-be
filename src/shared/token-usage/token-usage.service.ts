import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/infrastructure/drizzle/drizzle.service';
import {
	subscribers,
	tokenUsage,
} from '../database/infrastructure/drizzle/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class TokenUsageService {
	private readonly logger = new Logger(TokenUsageService.name);

	constructor(private readonly drizzle: DrizzleService) {}

	/**
	 * Saves the token usage for a user.
	 * @param userId The ID of the user.
	 * @param totalTokens The number of tokens used.
	 * @param model The name of the model used.
	 */
	async save(
		userId: string,
		totalTokens: number,
		model: string,
	): Promise<void> {
		try {
			this.logger.log(`Recording token usage for user: ${userId}`);

			// Find the user's active subscription
			const subscription = await this.drizzle.db.query.subscribers.findFirst({
				where: and(
					eq(subscribers.userId, userId),
					eq(subscribers.subscribed, true),
				),
				columns: {
					id: true,
				},
			});

			if (!subscription) {
				this.logger.warn(
					`No active subscription found for user ${userId}. Token usage will not be recorded.`,
				);
				return;
			}

			// Insert the token usage record
			await this.drizzle.db.insert(tokenUsage).values({
				userId,
				subscriptionId: subscription.id,
				totalTokens,
				model,
			});

			this.logger.log(
				`Successfully recorded ${totalTokens} tokens for user ${userId}`,
			);
		} catch (error) {
			this.logger.error('Error recording token usage:', error);
		}
	}
}
