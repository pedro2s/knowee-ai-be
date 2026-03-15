import { History } from 'src/shared/history/domain/entities/history.entity';

export type AIUsageModality =
	| 'text'
	| 'embedding'
	| 'image'
	| 'tts'
	| 'analysis'
	| 'history_summary';

export type AIUsageUnitType =
	| 'tokens'
	| 'image'
	| 'audio_char'
	| 'audio_minute'
	| 'request';

export interface AIUsageMetrics {
	provider?: string;
	model: string;
	operation?: string;
	modality?: AIUsageModality;
	unitType?: AIUsageUnitType;
	billableUnits?: number;
	totalUnits?: number;
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	estimatedCostUsd?: number;
	metadata?: Record<string, unknown>;
}

export interface InteractionContext<T> {
	input: T;
	summary: string | null;
	recentHistory: History[];
	tools?: unknown[];
}

export interface InteractionResult<T> {
	content: T;
	tokenUsage?: AIUsageMetrics;
}
