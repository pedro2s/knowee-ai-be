import { OnModuleInit } from '@nestjs/common';
import { AIAssistantPort } from '../../domain/ports/ai-assistant.port';
import { OpeanAIAssistantAdapter } from './openai/openai-assistant.adapter';

export class ProviderRegistry implements OnModuleInit {
	private readonly providers: Map<string, AIAssistantPort> = new Map();

	constructor(private readonly openAIAssistant: OpeanAIAssistantAdapter) {}

	onModuleInit() {
		this.register('openai', this.openAIAssistant);
	}

	private register(name: string, provider: AIAssistantPort) {
		this.providers.set(name, provider);
	}

	getAIAssistantStrategy(providerName: string): AIAssistantPort {
		const strategy = this.providers.get(providerName);
		if (!strategy) {
			throw new Error(`Provider ${providerName} not registered`);
		}
		return strategy;
	}
}
