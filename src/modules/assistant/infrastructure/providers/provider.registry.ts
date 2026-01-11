import { Injectable, OnModuleInit } from '@nestjs/common';
import { AIAssistantPort } from '../../domain/ports/ai-assistant.port';
import { OpenAIAssistantAdapter } from './openai/openai-assistant.adapter';
import { TextGeneratorPort } from '../../domain/ports/text-generator.port';
import { OpenAITextGeneratorAdapter } from './openai/openai-text-generator.adapter';
import { ArticleGeneratorPort } from '../../domain/ports/article-generator.port';
import { OpenAIArticleGeneratorAdapter } from './openai/openai-article-generator.adapter';

@Injectable()
export class ProviderRegistry implements OnModuleInit {
	private assistantProviders: Map<string, AIAssistantPort> = new Map();
	private textGeneratorProviders: Map<string, TextGeneratorPort> = new Map();
	private articleGeneratorProviders: Map<string, ArticleGeneratorPort> =
		new Map();

	constructor(
		private readonly openAIAssistant: OpenAIAssistantAdapter,
		private readonly textGenerator: OpenAITextGeneratorAdapter,
		private readonly articleGenerator: OpenAIArticleGeneratorAdapter
	) {}

	onModuleInit() {
		this.assistantProviders.set('openai', this.openAIAssistant);
		this.textGeneratorProviders.set('openai', this.textGenerator);
		this.articleGeneratorProviders.set('openai', this.articleGenerator);
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

	getArticleGeneratorStrategy(providerName: string): ArticleGeneratorPort {
		const strategy = this.articleGeneratorProviders.get(providerName);
		if (!strategy) throw new Error(`Provider ${providerName} não registrado`);
		return strategy;
	}
}
