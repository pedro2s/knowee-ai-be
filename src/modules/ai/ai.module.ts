import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ProviderRegistry } from './infrasctructure/providers/provider.registry';
import { OpenAIAudioGeneratorAdapter } from './infrasctructure/providers/openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './infrasctructure/providers/openai/openai-image-generator.adapter';
import { OpenAICourseGeneratorAdapter } from './infrasctructure/providers/openai/openai-course-generator.adapter';

export const OPENAI_CLIENT = 'OPENAI_CLIENT';

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
		ProviderRegistry,
		OpenAICourseGeneratorAdapter,
		OpenAIAudioGeneratorAdapter,
		OpenAIImageGeneratorAdapter,
	],
	exports: [ProviderRegistry],
})
export class AIModule {}
