import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';
import { GenerateArticleDto } from '../dtos/generate-article.dto';
import { ModuleRepositoryPort } from 'src/modules/course-authoring/domain/ports/module-repository.port';
import { GeneratedArticleOutput } from '../../domain/entities/generate-article.types';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';

@Injectable()
export class GenerateArticleUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		private readonly historyService: HistoryServicePort,
		private readonly tokenUsageService: TokenUsagePort,
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

		const articleGenerator = this.providerRegistry.getGenerateArticleStrategy(
			ai?.provider || 'openai'
		);

		const summary = await this.historyService.getSummary(courseId, authContext);
		const window = await this.historyService.getWindowMessages(
			courseId,
			authContext
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
			courseId,
			'user',
			`Título do módulo: ${module.title}\nDescrição do módulo: ${module.description}\n
			Título da aula: ${title}\nDescrição da aula: ${description}`,
			authContext
		);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			courseId,
			'assistant',
			generatedArticle.content,
			authContext
		);

		return generatedArticle;
	}
}
