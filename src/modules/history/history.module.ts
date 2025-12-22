import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { HISTORY_REPOSITORY } from './domain/ports/history-repository.port';
import { DrizzleHistoryRepository } from './infrastructure/persistence/drizzle/drizzle-history.repository';
import { HistoryService } from './application/services/history.service';

@Module({
	imports: [DatabaseModule],
	providers: [
		HistoryService,
		{
			provide: HISTORY_REPOSITORY,
			useClass: DrizzleHistoryRepository,
		},
	],
	exports: [HistoryService],
})
export class HistoryModule {}
