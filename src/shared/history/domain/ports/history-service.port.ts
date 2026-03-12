import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { History } from '../entities/history.entity';

export abstract class HistoryServicePort {
	abstract getWindowMessages(
		courseId: string,
		context: AuthContext
	): Promise<History[]>;

	abstract getSummary(
		courseId: string,
		context: AuthContext
	): Promise<string | undefined>;

	abstract shouldSummarizeHistory(
		courseId: string,
		context: AuthContext
	): Promise<boolean>;

	abstract saveMessage(
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
		context: AuthContext
	): Promise<void>;

	abstract saveMessageAndSummarizeIfNecessary(
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
		context: AuthContext
	): Promise<void>;

	abstract summarizeHistory(
		courseId: string,
		context: AuthContext
	): Promise<void>;
}
