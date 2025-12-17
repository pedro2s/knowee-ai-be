import { Injectable, OnModuleInit } from '@nestjs/common';
import { AudioGeneratorPort } from '../../domain/ports/audio-generator.port';
import { OpenAIAudioGeneratorAdapter } from './openai/openai-audio-generator.adapter';

@Injectable()
export class AudioProviderRegistry implements OnModuleInit {
	private strategies: Map<string, AudioGeneratorPort> = new Map();

	constructor(
		private openAIAudioGeneratorAdapter: OpenAIAudioGeneratorAdapter,
	) {}

	onModuleInit() {
		// Registra as estratégias com uma chave (slug)
		this.strategies.set('openai', this.openAIAudioGeneratorAdapter);
	}

	getProvider(provider: string): AudioGeneratorPort {
		const strategy = this.strategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de áudio '${provider}' não encontrado.`);
		}
		return strategy;
	}
}
