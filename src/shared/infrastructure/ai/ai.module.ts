import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { GENAI_CLIENT, OPENAI_CLIENT } from './ai.constants';

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
		{
			provide: GENAI_CLIENT,
			useFactory: () => new GoogleGenAI({}),
		},
	],
	exports: [OPENAI_CLIENT, GENAI_CLIENT],
})
export class AIModule {}
