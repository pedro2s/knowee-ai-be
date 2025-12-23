import { Injectable, OnModuleInit } from '@nestjs/common';
import { AIAssistantPort } from '../../domain/ports/ai-assistant.port';
import { OpenAIAssistantAdapter } from './openai/openai-assistant.adapter';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
	private providers: Map<string, AIAssistantPort> = new Map();

	constructor(private readonly openAIAssistant: OpenAIAssistantAdapter) {}

	onModuleInit() {
		this.register('openai', this.openAIAssistant);
	}

	private register(name: string, provider: AIAssistantPort) {
		this.providers.set(name, provider);
	}

	getAIAssistantStrategy(providerName: string): AIAssistantPort {
		const strategy = this.providers.get(providerName);
		if (!strategy) {
			throw new Error(`Provider ${providerName} não registrado`);
		}
		return strategy;
	}
}
