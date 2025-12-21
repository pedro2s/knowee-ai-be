import { AuthContext } from '@shared/database/application/ports/db-context.port';
import { HistoryMessageEntity } from '../entities/history-message.entity';

export const HISTORY_REPOSITORY = 'HISTORY_REPOSITORY';

export interface HistoryRepository {
	findWindowMessages(
		context: AuthContext,
		courseId: string,
		windowSize: number,
	): Promise<HistoryMessageEntity[]>;

	findSummary(
		context: AuthContext,
		courseId: string,
	): Promise<{ summary: string | null }>;

	countMessages(context: AuthContext, courseId: string): Promise<number>;

	saveMessage(
		context: AuthContext,
		courseId: string,
		message: HistoryMessageEntity,
	): Promise<void>;

	saveSummary(
		context: AuthContext,
		courseId: string,
		summary: string,
	): Promise<void>;
}
