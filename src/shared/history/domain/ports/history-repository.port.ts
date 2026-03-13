import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { History } from '../entities/history.entity';

export abstract class HistoryRepositoryPort {
	abstract findHistory(
		courseId: string,
		context: AuthContext
	): Promise<History[]>;

	abstract findWindowHistory(
		courseId: string,
		windowSize: number,
		context: AuthContext
	): Promise<History[]>;

	abstract countMessages(
		courseId: string,
		context: AuthContext
	): Promise<number>;

	abstract saveHistory(history: History, context: AuthContext): Promise<void>;

	abstract deleteHistory(courseId: string, context: AuthContext): Promise<void>;
}
