import { AIUsageMetrics } from 'src/shared/types/interaction';

export interface AIUsageRecordInput extends AIUsageMetrics {
	userId: string;
	courseId?: string;
	moduleId?: string;
	lessonId?: string;
	jobId?: string;
	subscriptionId?: string | null;
}

export abstract class TokenUsagePort {
	abstract save(
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
	): Promise<void>;

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
}
