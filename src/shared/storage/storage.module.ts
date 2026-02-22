import { Module } from '@nestjs/common';
import { FileProcessingService } from './infrastructure/file-processing.service';
import { FILE_PROCESSING_SERVICE } from './domain/ports/file-processing.port';
import { EMBEDDING_SERVICE } from './domain/ports/embedding.port';
import { EmbeddingService } from './infrastructure/embedding.service';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { DatabaseModule } from '../database/database.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';

@Module({
	imports: [DatabaseModule, AIProvidersModule, TokenUsageModule],
	providers: [
		{
			provide: FILE_PROCESSING_SERVICE,
			useClass: FileProcessingService,
		},
		{
			provide: EMBEDDING_SERVICE,
			useClass: EmbeddingService,
		},
	],
	exports: [FILE_PROCESSING_SERVICE, EMBEDDING_SERVICE],
})
export class StorageModule {}
