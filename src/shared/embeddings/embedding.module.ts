import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { AIModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';

@Module({
	imports: [DatabaseModule, AIModule, TokenUsageModule],
	providers: [EmbeddingService],
	exports: [EmbeddingService],
})
export class EmbeddingModule {}
