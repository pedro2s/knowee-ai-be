import { Injectable, OnModuleInit } from '@nestjs/common';
import type { AudioGeneratorPort } from '../../../course-authoring/domain/ports/audio-generator.port';
import type { ImageGeneratorPort } from '../../../course-authoring/domain/ports/image-generator.port';
import { OpenAIAudioGeneratorAdapter } from './openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './openai/openai-image-generator.adapter';
import { OpenAICourseGeneratorAdapter } from './openai/openai-course-generator.adapter';
import { CourseGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-generator.port';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
	private audioStrategies: Map<string, AudioGeneratorPort> = new Map();
	private imageStrategies: Map<string, ImageGeneratorPort> = new Map();
	private courseStrategies: Map<string, CourseGeneratorPort> = new Map();

	constructor(
		private openAIAudioGeneratorAdapter: OpenAIAudioGeneratorAdapter,
		private openAIImageGeneratorAdapter: OpenAIImageGeneratorAdapter,
		private OpenAICourseGeneratorAdapter: OpenAICourseGeneratorAdapter
	) {}

	onModuleInit() {
		// Registra as estratégias de áudio com uma chave (slug)
		this.audioStrategies.set('openai', this.openAIAudioGeneratorAdapter);

		// Registra as estratégias de imagem com uma chave (slug)
		this.imageStrategies.set('openai', this.openAIImageGeneratorAdapter);

		// Registra as estratégias de course com uma chave (slug)
		this.courseStrategies.set('openai', this.OpenAICourseGeneratorAdapter);
	}

	getAudioStrategy(provider: string): AudioGeneratorPort {
		const strategy = this.audioStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de áudio '${provider}' não encontrado.`);
		}
		return strategy;
	}

	getImageStrategy(provider: string): ImageGeneratorPort {
		const strategy = this.imageStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de imagem '${provider}' não encontrado.`);
		}
		return strategy;
	}

	getCourseStrategy(provider: string): CourseGeneratorPort {
		const strategy = this.courseStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de course '${provider}' não encontrado.`);
		}
		return strategy;
	}
}
