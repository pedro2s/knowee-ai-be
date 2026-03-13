import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { HistorySummary } from '../entities/history-summary.entity';

export abstract class HistorySummaryRepositoryPort {
	abstract findHistorySummary(
		courseId: string,
		context: AuthContext
	): Promise<HistorySummary | null>;

	abstract saveHistorySummary(
		historySummary: HistorySummary,
		context: AuthContext
	): Promise<void>;
}
