import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { GENAI_CLIENT, OPENAI_CLIENT } from './ai-providers.constants';
import { ProviderRegistry } from './infrastructure/registry/provider.registry';
import { OpenAITTSProviderAdapter } from './infrastructure/adapters/openai/openai-tts.provider.adapter';
import { OpenAIImageProviderAdapter } from './infrastructure/adapters/openai/openai-image.provider.adapter';

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
		OpenAIImageProviderAdapter,
	],
	exports: [OPENAI_CLIENT, GENAI_CLIENT, ProviderRegistry],
})
export class AIProvidersModule implements OnModuleInit {
	constructor(
		private registry: ProviderRegistry,
		private readonly openaiTTSProvider: OpenAITTSProviderAdapter,
		private readonly openaiImageProvider: OpenAIImageProviderAdapter
	) {}

	onModuleInit() {
		this.registry.register('openai', 'tts', this.openaiTTSProvider);
		this.registry.register('openai', 'image', this.openaiImageProvider);
	}
}
