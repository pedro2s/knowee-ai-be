import { Inject, Injectable } from '@nestjs/common';
import { GenerateTextDto } from '../dtos/generate-text.dto';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { GeneratedTextOutput } from '../../domain/entities/generate-text.types';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';

@Injectable()
export class GenerateTextUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
	) {}

	async execute(
		input: GenerateTextDto,
		userId: string,
	): Promise<GeneratedTextOutput> {
		const { courseId, prompt, ai } = input;

		const auth: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const textGenerator = this.providerRegistry.getTextGeneratorStrategy(
			ai?.provider || 'openai',
		);

		const summary = await this.historyService.getSummary(auth, courseId);
		const window = await this.historyService.getWindowMessages(
			auth,
			courseId,
		);

		const generatedText = await textGenerator.generate({
			input: {
				prompt,
			},
			summary: summary || null,
			recentHistory: window,
		});

		await this.historyService.saveMessage(auth, courseId, 'user', prompt);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			auth,
			courseId,
			'assistant',
			generatedText.text,
		);

		return generatedText;
	}
}
