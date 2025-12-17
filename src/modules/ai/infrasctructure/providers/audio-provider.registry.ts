import { Injectable, OnModuleInit } from '@nestjs/common';
import type { AudioGeneratorPort } from '../../../course-authoring/domain/ports/audio-generator.port';
import type { ImageGeneratorPort } from '../../../course-authoring/domain/ports/image-generator.port';
import { OpenAIAudioGeneratorAdapter } from './openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './openai/openai-image-generator.adapter';

@Injectable()
export class AudioProviderRegistry implements OnModuleInit {
	private audioStrategies: Map<string, AudioGeneratorPort> = new Map();
  private imageStrategies: Map<string, ImageGeneratorPort> = new Map();

	constructor(
		private openAIAudioGeneratorAdapter: OpenAIAudioGeneratorAdapter,
    private openAIImageGeneratorAdapter: OpenAIImageGeneratorAdapter,
	) {}

	onModuleInit() {
		// Registra as estratégias de áudio com uma chave (slug)
		this.audioStrategies.set('openai', this.openAIAudioGeneratorAdapter);

    // Registra as estratégias de imagem com uma chave (slug)
    this.imageStrategies.set('openai', this.openAIImageGeneratorAdapter);
	}

	getProvider(provider: string): AudioGeneratorPort {
		const strategy = this.audioStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de áudio '${provider}' não encontrado.`);
		}
		return strategy;
	}

  getImage(provider: string): ImageGeneratorPort {
    const strategy = this.imageStrategies.get(provider);
    if (!strategy) {
      throw new Error(`Provider de imagem '${provider}' não encontrado.`);
    }
    return strategy;
  }
}
