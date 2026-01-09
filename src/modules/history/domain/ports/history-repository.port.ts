import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { History } from '../entities/history.entity';

export const HISTORY_REPOSITORY = 'HISTORY_REPOSITORY';

export interface HistoryRepositoryPort {
	findHistory(courseId: string, context: AuthContext): Promise<History[]>;

	findWindowHistory(
		courseId: string,
		windowSize: number,
		context: AuthContext
	): Promise<History[]>;

	countMessages(courseId: string, context: AuthContext): Promise<number>;

	saveHistory(history: History, context: AuthContext): Promise<void>;

	deleteHistory(courseId: string, context: AuthContext): Promise<void>;
}
