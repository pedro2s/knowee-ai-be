import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { AIModule } from '../ai/ai.module';
import { DatabaseModule } from '../../database/database.module';
import { TokenUsageModule } from '../token-usage/token-usage.module';
import { EMBEDDING_SERVICE } from '../../application/ports/embedding.port';

@Module({
	imports: [DatabaseModule, AIModule, TokenUsageModule],
	providers: [
		{
			provide: EMBEDDING_SERVICE,
			useClass: EmbeddingService,
		},
	],
	exports: [EMBEDDING_SERVICE],
})
export class EmbeddingModule {}
