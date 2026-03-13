import { History } from 'src/shared/history/domain/entities/history.entity';

export interface InteractionContext<T> {
	input: T;
	summary: string | null;
	recentHistory: History[];
	tools?: unknown[];
}

export interface InteractionResult<T> {
	content: T;
	tokenUsage?: {
		totalTokens: number;
		model: string;
	};
}
