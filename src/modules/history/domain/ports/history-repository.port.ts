import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { History } from '../entities/history.entity';

export const HISTORY_REPOSITORY = 'HISTORY_REPOSITORY';

export interface HistoryRepositoryPort {
	findWindowMessages(
		courseId: string,
		windowSize: number,
		context: AuthContext,
	): Promise<History[]>;

	countMessages(courseId: string, context: AuthContext): Promise<number>;

	saveMessage(
		courseId: string,
		message: History,
		context: AuthContext,
	): Promise<void>;
}
