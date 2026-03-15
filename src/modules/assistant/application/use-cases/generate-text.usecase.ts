import { Injectable } from '@nestjs/common';
import { GenerateTextDto } from '../dtos/generate-text.dto';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { GeneratedTextOutput } from '../../domain/entities/generate-text.types';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

@Injectable()
export class GenerateTextUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		private readonly historyService: HistoryServicePort,
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

		const summary = await this.historyService.getSummary(courseId, auth);
		const window = await this.historyService.getWindowMessages(courseId, auth);

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
			await this.tokenUsageService.record({
				userId: auth.userId,
				courseId,
				...tokenUsage,
			});
		}

		await this.historyService.saveMessage(courseId, 'user', prompt, auth);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			courseId,
			'assistant',
			generatedText.text,
			auth
		);

		return generatedText;
	}
}
