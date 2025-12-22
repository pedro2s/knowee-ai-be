import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { HISTORY_REPOSITORY } from './domain/ports/history-repository.port';
import { DrizzleHistoryRepository } from './infrastructure/persistence/drizzle/drizzle-history.repository';
import { HistoryService } from './application/services/history.service';
import { AIModule } from 'src/shared/ai/ai.module';
import { SummarizeHistoryUseCase } from './application/use-cases/summarize-history.usecase';
import { OpenAISummarizeHistoryAdapter } from './infrastructure/providers/openai/openai-summarize-history.adapter';
import { DrizzleHistorySummaryRepository } from './infrastructure/persistence/drizzle/drizzle-history-summary.repository';
import { HISTORY_SUMMARY_REPOSITORY } from './domain/ports/history-summary-repository.port';

@Module({
	imports: [DatabaseModule, AIModule],
	providers: [
		HistoryService,
		SummarizeHistoryUseCase,
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
	exports: [HistoryService, SummarizeHistoryUseCase],
})
export class HistoryModule {}
