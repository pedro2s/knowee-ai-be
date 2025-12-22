import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { HistorySummary } from '../entities/history-summary.entity';

export const HISTORY_SUMMARY_REPOSITORY = 'HISTORY_SUMMARY_REPOSITORY';

export interface HistorySummaryRepositoryPort {
	findSummary(
		courseId: string,
		context: AuthContext,
	): Promise<HistorySummary | null>;

	saveSummary(
		courseId: string,
		summary: string,
		context: AuthContext,
	): Promise<void>;
}
