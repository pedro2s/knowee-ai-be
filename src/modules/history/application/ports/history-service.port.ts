import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { History } from '../../domain/entities/history.entity';

export const HISTORY_SERVICE = 'HISTORY_SERVICE';

export interface HistoryServicePort {
	getWindowMessages(context: AuthContext, courseId: string): Promise<History[]>;

	getSummary(
		context: AuthContext,
		courseId: string
	): Promise<string | undefined>;

	shouldSummarizeHistory(
		context: AuthContext,
		courseId: string
	): Promise<boolean>;

	saveMessage(
		context: AuthContext,
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string
	): Promise<void>;

	saveMessageAndSummarizeIfNecessary(
		context: AuthContext,
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string
	): Promise<void>;

	summarizeHistory(context: AuthContext, courseId: string): Promise<void>;
}
