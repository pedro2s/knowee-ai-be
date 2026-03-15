import { AIUsageMetrics, AIUsageModality } from 'src/shared/types/interaction';

export function buildOpenAITextUsage(input: {
	model: string;
	operation: string;
	modality: AIUsageModality;
	usage?: {
		prompt_tokens?: number;
		completion_tokens?: number;
		total_tokens?: number;
	} | null;
	metadata?: Record<string, unknown>;
}): AIUsageMetrics | undefined {
	const totalTokens = input.usage?.total_tokens;
	if (!totalTokens) {
		return undefined;
	}

	return {
		provider: 'openai',
		model: input.model,
		operation: input.operation,
		modality: input.modality,
		unitType: 'tokens',
		inputTokens: input.usage?.prompt_tokens,
		outputTokens: input.usage?.completion_tokens,
		totalTokens,
		totalUnits: totalTokens,
		billableUnits: totalTokens,
		metadata: input.metadata,
	};
}

export function buildGeminiTextUsage(input: {
	model: string;
	operation: string;
	modality: AIUsageModality;
	usageMetadata?: {
		promptTokenCount?: number;
		candidatesTokenCount?: number;
		totalTokenCount?: number;
	} | null;
	metadata?: Record<string, unknown>;
}): AIUsageMetrics | undefined {
	const totalTokens = input.usageMetadata?.totalTokenCount;
	if (!totalTokens) {
		return undefined;
	}

	return {
		provider: 'google',
		model: input.model,
		operation: input.operation,
		modality: input.modality,
		unitType: 'tokens',
		inputTokens: input.usageMetadata?.promptTokenCount,
		outputTokens: input.usageMetadata?.candidatesTokenCount,
		totalTokens,
		totalUnits: totalTokens,
		billableUnits: totalTokens,
		metadata: input.metadata,
	};
}
