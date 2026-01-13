import { Injectable, OnModuleInit } from '@nestjs/common';
import { AIAssistantPort } from '../../domain/ports/ai-assistant.port';
import { OpenAIAssistantAdapter } from './openai/openai-assistant.adapter';
import { TextGeneratorPort } from '../../domain/ports/text-generator.port';
import { OpenAITextGeneratorAdapter } from './openai/openai-text-generator.adapter';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
	private assistantProviders: Map<string, AIAssistantPort> = new Map();
	private textGeneratorProviders: Map<string, TextGeneratorPort> = new Map();

	constructor(
		private readonly openAIAssistant: OpenAIAssistantAdapter,
		private readonly textGenerator: OpenAITextGeneratorAdapter
	) {}

	onModuleInit() {
		this.assistantProviders.set('openai', this.openAIAssistant);
		this.textGeneratorProviders.set('openai', this.textGenerator);
	}

	getAIAssistantStrategy(providerName: string): AIAssistantPort {
		const strategy = this.assistantProviders.get(providerName);
		if (!strategy) {
			throw new Error(`Provider ${providerName} não registrado`);
		}
		return strategy;
	}

	getTextGeneratorStrategy(providerName: string): TextGeneratorPort {
		const strategy = this.textGeneratorProviders.get(providerName);
		if (!strategy) throw new Error(`Provider ${providerName} não registrado`);
		return strategy;
	}
}
