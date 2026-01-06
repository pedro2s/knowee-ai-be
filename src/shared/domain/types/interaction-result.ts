import { HistoryMessage } from 'src/modules/history/domain/value-objects/history-message.vo';

export interface InteractionResult<T> {
	content: T;
	history: HistoryMessage[];
	tokenUsage?: {
		totalTokens: number;
		model: string;
	};
}
