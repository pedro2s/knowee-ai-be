import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './ai.constants';

@Module({
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
	],
	exports: [OPENAI_CLIENT],
})
export class AIModule {}
