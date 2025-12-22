import { History } from '../entities/history.entity';

export interface SummarizeHistoryPort {
	summarizeHistory(history: History[]): Promise<string>;
}
