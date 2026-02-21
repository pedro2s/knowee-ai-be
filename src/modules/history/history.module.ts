import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { HISTORY_REPOSITORY } from './domain/ports/history-repository.port';
import { DrizzleHistoryRepository } from './infrastructure/persistence/drizzle/drizzle-history.repository';
import { HistoryService } from './infrastructure/services/history.service';
import { AIModule } from 'src/shared/infrastructure/ai/ai.module';
import { OpenAISummarizeHistoryAdapter } from './infrastructure/providers/openai/openai-summarize-history.adapter';
import { DrizzleHistorySummaryRepository } from './infrastructure/persistence/drizzle/drizzle-history-summary.repository';
import { HISTORY_SUMMARY_REPOSITORY } from './domain/ports/history-summary-repository.port';
import { HISTORY_SERVICE } from './application/ports/history-service.port';

@Module({
	imports: [DatabaseModule, AIModule],
	providers: [
		{ provide: HISTORY_SERVICE, useClass: HistoryService },
		{
			provide: HISTORY_REPOSITORY,
			useClass: DrizzleHistoryRepository,
		},
		{
			provide: HISTORY_SUMMARY_REPOSITORY,
			useClass: DrizzleHistorySummaryRepository,
		},
		OpenAISummarizeHistoryAdapter,
	],
	exports: [HISTORY_SERVICE, HISTORY_REPOSITORY, HISTORY_SUMMARY_REPOSITORY],
})
export class HistoryModule {}
