import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { GENAI_CLIENT, OPENAI_CLIENT } from './ai-providers.constants';
import { ProviderRegistry } from './infrastructrue/registry/provider.registry';
import { OpenAITTSProviderAdapter } from './infrastructrue/openai/openai-tts.provider.adapter';

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
		ProviderRegistry,
		OpenAITTSProviderAdapter,
	],
	exports: [OPENAI_CLIENT, GENAI_CLIENT],
})
export class AIProvidersModule implements OnModuleInit {
	constructor(
		private registry: ProviderRegistry,
		private readonly openaiTTSProvider: OpenAITTSProviderAdapter
	) {}

	onModuleInit() {
		this.registry.register('openai', 'tts', this.openaiTTSProvider);
	}
}
