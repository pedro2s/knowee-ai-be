import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { History } from '../entities/history.entity';

export const HISTORY_REPOSITORY = 'HISTORY_REPOSITORY';

export interface HistoryRepository {
	findWindowMessages(
		courseId: string,
		windowSize: number,
		context: AuthContext,
	): Promise<History[]>;

	findSummary(
		courseId: string,
		context: AuthContext,
	): Promise<{ summary: string | null }>;

	countMessages(courseId: string, context: AuthContext): Promise<number>;

	saveMessage(
		courseId: string,
		message: History,
		context: AuthContext,
	): Promise<void>;

	saveSummary(
		courseId: string,
		summary: string,
		context: AuthContext,
	): Promise<void>;
}
