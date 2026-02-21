import { Inject, Injectable } from '@nestjs/common';
import { GenerateTextDto } from '../dtos/generate-text.dto';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { GeneratedTextOutput } from '../../domain/entities/generate-text.types';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/shared/history/application/ports/history-service.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/token-usage/domain/ports/token-usage.port';

@Injectable()
export class GenerateTextUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort
	) {}

	async execute(
		input: GenerateTextDto,
		userId: string
	): Promise<GeneratedTextOutput> {
		const { courseId, prompt, ai } = input;

		const auth: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const textGenerator = this.providerRegistry.getTextGeneratorStrategy(
			ai?.provider || 'openai'
		);

		const summary = await this.historyService.getSummary(auth, courseId);
		const window = await this.historyService.getWindowMessages(auth, courseId);

		const { content: generatedText, tokenUsage } = await textGenerator.generate(
			{
				input: {
					prompt,
				},
				summary: summary || null,
				recentHistory: window,
			}
		);

		if (tokenUsage) {
			await this.tokenUsageService.save(
				auth.userId,
				tokenUsage.totalTokens,
				tokenUsage.model
			);
		}

		await this.historyService.saveMessage(auth, courseId, 'user', prompt);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			auth,
			courseId,
			'assistant',
			generatedText.text
		);

		return generatedText;
	}
}
