import { Module } from '@nestjs/common';
import { AudioProviderRegistry } from './infrasctructure/providers/audio-provider.registry';
import { OpenAIImageGeneratorAdapter } from './infrasctructure/providers/openai/openai-image-generator.adapter';
import { OpenAIAudioGeneratorAdapter } from './infrasctructure/providers/openai/openai-audio-generator.adapter';

@Module({
	providers: [
		AudioProviderRegistry,
		OpenAIAudioGeneratorAdapter,
		OpenAIImageGeneratorAdapter,
	],
})
export class AIModule {}
