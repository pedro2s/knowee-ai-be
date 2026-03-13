import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { HistoryRepositoryPort } from './domain/ports/history-repository.port';
import { DrizzleHistoryRepository } from './infrastructure/persistence/drizzle/drizzle-history.repository';
import { HistoryService } from './infrastructure/services/history.service';
import { AIProvidersModule } from 'src/shared/ai-providers/ai-providers.module';
import { OpenAISummarizeHistoryAdapter } from './infrastructure/providers/openai/openai-summarize-history.adapter';
import { DrizzleHistorySummaryRepository } from './infrastructure/persistence/drizzle/drizzle-history-summary.repository';
import { HistorySummaryRepositoryPort } from './domain/ports/history-summary-repository.port';
import { HistoryServicePort } from './domain/ports/history-service.port';

@Module({
	imports: [DatabaseModule, AIProvidersModule],
	providers: [
		{ provide: HistoryServicePort, useClass: HistoryService },
		{
			provide: HistoryRepositoryPort,
			useClass: DrizzleHistoryRepository,
		},
		{
			provide: HistorySummaryRepositoryPort,
			useClass: DrizzleHistorySummaryRepository,
		},
		OpenAISummarizeHistoryAdapter,
	],
	exports: [
		HistoryServicePort,
		HistoryRepositoryPort,
		HistorySummaryRepositoryPort,
	],
})
export class HistoryModule {}
