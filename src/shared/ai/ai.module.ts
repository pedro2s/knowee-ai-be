import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './ai.constants';
import { EmbeddingService } from '../embeddings/embedding.service';
import { DatabaseModule } from '../database/database.module';
import { TokenUsageService } from '../token-usage/token-usage.service';

@Module({
	imports: [DatabaseModule],
	providers: [
		{
			provide: OPENAI_CLIENT,
			useFactory: (configService: ConfigService) => {
				return new OpenAI({
					apiKey: configService.getOrThrow<string>('OPENAI_API_KEY'),
				});
			},
			inject: [ConfigService],
		},
		EmbeddingService,
		TokenUsageService,
	],
	exports: [OPENAI_CLIENT, EmbeddingService, TokenUsageService],
})
export class AIModule {}
