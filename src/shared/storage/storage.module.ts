import { Module } from '@nestjs/common';
import { FileProcessingService } from './infrastructure/file-processing.service';
import { EmbeddingService } from './infrastructure/embedding.service';
import { AIProvidersModule } from '../ai-providers/ai-providers.module';
import { DatabaseModule } from '../database/database.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';
import { StoragePort } from './domain/ports/storage.port';
import { S3StorageAdapter } from './infrastructure/s3-storage.adapter';
import { EmbeddingPort } from './domain/ports/embedding.port';
import { FileProcessingPort } from './domain/ports/file-processing.port';

@Module({
	imports: [DatabaseModule, AIProvidersModule, TokenUsageModule],
	providers: [
		{
			provide: FileProcessingPort,
			useClass: FileProcessingService,
		},
		{
			provide: EmbeddingPort,
			useClass: EmbeddingService,
		},
		{
			provide: StoragePort,
			useClass: S3StorageAdapter,
		},
	],
	exports: [FileProcessingPort, EmbeddingPort, StoragePort],
})
export class StorageModule {}
