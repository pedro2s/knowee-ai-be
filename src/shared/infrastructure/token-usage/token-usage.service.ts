import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle/drizzle.service';
import { subscribers, tokenUsage } from '../database/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { TokenUsagePort } from '../../application/ports/token-usage.port';

@Injectable()
export class TokenUsageService implements TokenUsagePort {
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
			this.logger.log(
				`Registrando uso de tokens para o usuário: ${userId}`,
			);

			// Find the user's active subscription
			const subscription =
				await this.drizzle.db.query.subscribers.findFirst({
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
					`Nenhuma assinatura ativa encontrada para o usuário ${userId}. O uso de tokens não será registrado.`,
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
				`Uso de ${totalTokens} tokens registrado com sucesso para o usuário ${userId}`,
			);
		} catch (error) {
			this.logger.error('Erro ao registrar uso de tokens:', error);
		}
	}
}
