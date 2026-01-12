import { Injectable, OnModuleInit } from '@nestjs/common';
import type { AudioGeneratorPort } from '../../../course-authoring/domain/ports/audio-generator.port';
import type { ImageGeneratorPort } from '../../../course-authoring/domain/ports/image-generator.port';
import { OpenAIAudioGeneratorAdapter } from './openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './openai/openai-image-generator.adapter';
import { OpenAICourseGeneratorAdapter } from './openai/openai-course-generator.adapter';
import { CourseGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-generator.port';
import { ModuleGeneratorPort } from '../../domain/ports/module-generator.port';
import { OpenAIModuleGeneratorAdapter } from './openai/openai-module-generator.adapter';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
	private generateCourseStrategies: Map<string, CourseGeneratorPort> =
		new Map();
	private generateModuleStrategies: Map<string, ModuleGeneratorPort> =
		new Map();
	private generateAudioStrategies: Map<string, AudioGeneratorPort> = new Map();
	private generateImageStrategies: Map<string, ImageGeneratorPort> = new Map();

	constructor(
		private OpenAICourseGeneratorAdapter: OpenAICourseGeneratorAdapter,
		private OpenAIModuleGeneratorAdapter: OpenAIModuleGeneratorAdapter,
		private openAIAudioGeneratorAdapter: OpenAIAudioGeneratorAdapter,
		private openAIImageGeneratorAdapter: OpenAIImageGeneratorAdapter
	) {}

	onModuleInit() {
		// Registra as estratégias de course com uma chave (slug)
		this.generateCourseStrategies.set(
			'openai',
			this.OpenAICourseGeneratorAdapter
		);

		// Registra as estratégias de module com uma chave (slug)
		this.generateModuleStrategies.set(
			'openai',
			this.OpenAIModuleGeneratorAdapter
		);

		// Registra as estratégias de áudio com uma chave (slug)
		this.generateAudioStrategies.set(
			'openai',
			this.openAIAudioGeneratorAdapter
		);

		// Registra as estratégias de imagem com uma chave (slug)
		this.generateImageStrategies.set(
			'openai',
			this.openAIImageGeneratorAdapter
		);
	}

	getGenerateAudioStrategy(provider: string): AudioGeneratorPort {
		const strategy = this.generateAudioStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de áudio '${provider}' não encontrado.`);
		}
		return strategy;
	}

	getGenerateImageStrategy(provider: string): ImageGeneratorPort {
		const strategy = this.generateImageStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de imagem '${provider}' não encontrado.`);
		}
		return strategy;
	}

	getGenerateCourseStrategy(provider: string): CourseGeneratorPort {
		const strategy = this.generateCourseStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de course '${provider}' não encontrado.`);
		}
		return strategy;
	}

	getGenerateModuleStrategy(provider: string): ModuleGeneratorPort {
		const strategy = this.generateModuleStrategies.get(provider);
		if (!strategy) {
			throw new Error(`Provider de course '${provider}' não encontrado.`);
		}
		return strategy;
	}
}
