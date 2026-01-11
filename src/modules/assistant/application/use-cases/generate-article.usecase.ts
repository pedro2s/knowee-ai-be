import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/application/ports/token-usage.port';
import { GenerateArticleDto } from '../dtos/generate-article.dto';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/module-repository.port';
import { GeneratedArticleOutput } from '../../domain/entities/generate-article.types';

@Injectable()
export class GenerateArticleUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort
	) {}

	async execute(
		input: GenerateArticleDto,
		userId: string
	): Promise<GeneratedArticleOutput> {
		const { courseId, moduleId, title, description, ai } = input;

		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const articleGenerator = this.providerRegistry.getArticleGeneratorStrategy(
			ai?.provider || 'openai'
		);

		const summary = await this.historyService.getSummary(authContext, courseId);
		const window = await this.historyService.getWindowMessages(
			authContext,
			courseId
		);

		const module = await this.moduleRepository.findById(moduleId, authContext);
		if (!module) {
			throw new BadRequestException('A propriedade moduleId é inválida.');
		}

		const { content: generatedArticle, tokenUsage } =
			await articleGenerator.generate({
				input: {
					moduleTitle: module.title,
					moduleDescription: module.description || '',
					lessonTitle: title,
					lessonDescription: description,
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
			`Título do módulo: ${module.title}\nDescrição do módulo: ${module.description}\n
			Título da aula: ${title}\nDescrição da aula: ${description}`
		);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			courseId,
			'assistant',
			generatedArticle.content
		);

		return generatedArticle;
	}
}
