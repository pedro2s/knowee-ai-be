import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../../database/infrastructure/drizzle/drizzle.service';
import {
	subscribers,
	tokenUsage,
} from '../../database/infrastructure/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import {
	AIUsageRecordInput,
	TokenUsagePort,
} from '../domain/ports/token-usage.port';
import { AIUsagePricingService } from './ai-usage-pricing.service';

@Injectable()
export class TokenUsageService implements TokenUsagePort {
	private readonly logger = new Logger(TokenUsageService.name);

	constructor(
		private readonly drizzle: DrizzleService,
		private readonly pricingService: AIUsagePricingService
	) {}

	async record(input: AIUsageRecordInput): Promise<void> {
		await this.save(
			input.userId,
			input.totalTokens ?? input.totalUnits ?? input.billableUnits ?? 0,
			input.model,
			{
				provider: input.provider,
				operation: input.operation,
				modality: input.modality,
				unitType: input.unitType,
				inputTokens: input.inputTokens,
				outputTokens: input.outputTokens,
				billableUnits: input.billableUnits,
				totalUnits: input.totalUnits,
				estimatedCostUsd: input.estimatedCostUsd,
				metadata: input.metadata,
				courseId: input.courseId,
				moduleId: input.moduleId,
				lessonId: input.lessonId,
				jobId: input.jobId,
				subscriptionId: input.subscriptionId,
			}
		);
	}

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
		options?: Omit<
			AIUsageRecordInput,
			'userId' | 'model' | 'totalTokens' | 'billableUnits' | 'totalUnits'
		> & {
			billableUnits?: number;
			totalUnits?: number;
			estimatedCostUsd?: number;
		}
	): Promise<void> {
		try {
			this.logger.log(`Registrando uso de tokens para o usuário: ${userId}`);

			const subscription = await this.drizzle.db.query.subscribers.findFirst({
				where: eq(subscribers.userId, userId),
				with: {
					subscriptionTier: {
						columns: {
							name: true,
						},
					},
				},
				orderBy: [desc(subscribers.createdAt)],
			});

			const usage = this.pricingService.normalize({
				provider: options?.provider ?? 'unknown',
				model,
				operation: options?.operation ?? 'legacy',
				modality: options?.modality ?? 'text',
				unitType: options?.unitType ?? 'tokens',
				inputTokens: options?.inputTokens,
				outputTokens: options?.outputTokens,
				totalTokens,
				totalUnits: options?.totalUnits ?? totalTokens,
				billableUnits: options?.billableUnits ?? totalTokens,
				estimatedCostUsd: options?.estimatedCostUsd,
				metadata: options?.metadata,
			});

			await this.drizzle.db.insert(tokenUsage).values({
				userId,
				subscriptionId: options?.subscriptionId ?? subscription?.id ?? null,
				totalTokens: usage.totalTokens ?? totalTokens,
				model,
				provider: usage.provider,
				operation: usage.operation,
				modality: usage.modality,
				unitType: usage.unitType,
				totalUnits: usage.totalUnits,
				billableUnits: usage.billableUnits,
				inputTokens: usage.inputTokens,
				outputTokens: usage.outputTokens,
				estimatedCostUsd:
					usage.estimatedCostUsd !== undefined
						? usage.estimatedCostUsd.toFixed(6)
						: null,
				courseId: options?.courseId ?? null,
				moduleId: options?.moduleId ?? null,
				lessonId: options?.lessonId ?? null,
				jobId: options?.jobId ?? null,
				subscriptionStatus: subscription?.status ?? 'free',
				planName: subscription?.subscriptionTier?.name ?? 'free',
				metadata: options?.metadata ?? {},
			});

			this.logger.log(
				`Uso de ${usage.billableUnits} unidades registrado com sucesso para o usuário ${userId}`
			);
		} catch (error) {
			this.logger.error('Erro ao registrar uso de tokens:', error);
		}
	}
}
