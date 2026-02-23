import { Inject, Injectable } from '@nestjs/common';
import { GenerateLessonScriptDto } from '../dtos/generate-lesson-script.dto';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/shared/history/domain/ports/history-service.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/token-usage/domain/ports/token-usage.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import { GeneratedLessonScript } from '../../domain/entities/lesson-script.types';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';

@Injectable()
export class GenerateLessonScriptUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort
	) {}

	async execute(
		input: GenerateLessonScriptDto,
		userId: string
	): Promise<GeneratedLessonScript> {
		const { courseId, moduleId, title, description, ai } = input;
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const lessonScriptGenerator =
			this.providerRegistry.getGenerateLessonScriptStrategy(
				ai?.provider || 'openai'
			);

		const summary = await this.historyService.getSummary(authContext, courseId);
		const window = await this.historyService.getWindowMessages(
			authContext,
			courseId
		);

		const { content: generatedLessonScript, tokenUsage } =
			await lessonScriptGenerator.generate({
				input: {
					title,
					description,
				},
				summary: summary || null,
				recentHistory: window,
			});

		if (tokenUsage) {
			await this.tokenUsageService.save(
				authContext.userId,
				tokenUsage.totalTokens,
				tokenUsage.model
			);
		}

		await this.historyService.saveMessage(
			authContext,
			courseId,
			'user',
			`Título da aula: ${title}\nDescrição da aula: ${description}`
		);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			courseId,
			'assistant',
			JSON.stringify(generatedLessonScript.scriptSections)
		);

		return generatedLessonScript;
	}
}
