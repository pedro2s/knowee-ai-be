import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/application/ports/token-usage.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { GenerateModuleDto } from '../dtos/generate-module.dto';
import { Module } from '../../domain/entities/module.entity';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import { Lesson } from '../../domain/entities/lesson.entity';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

@Injectable()
export class GenerateModuleUseCase {
	private readonly logger = new Logger(GenerateModuleUseCase.name);

	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		private readonly providerRegistry: ProviderRegistry
	) {}

	async execute(input: GenerateModuleDto, userId: string): Promise<Module> {
		const moduleGen = this.providerRegistry.getGenerateModuleStrategy(
			input.ai?.provider || 'openai'
		);

		const auth: AuthContext = {
			userId: userId,
			role: 'authenticated',
		};

		const summary = await this.historyService.getSummary(auth, input.courseId);
		const window = await this.historyService.getWindowMessages(
			auth,
			input.courseId
		);

		const { content: generatedModule, tokenUsage } = await moduleGen.generate({
			input: { courseId: input.courseId },
			summary: summary || null,
			recentHistory: window,
		});

		if (tokenUsage) {
			await this.tokenUsageService.save(
				userId,
				tokenUsage.totalTokens,
				tokenUsage.model
			);
		}

		const savedModule = await this.moduleRepository.saveModuleTree(
			{ ...generatedModule, courseId: input.courseId },
			auth
		);

		// input stringify sem o files
		const userMessage = JSON.stringify({
			...input,
			files: 'omitted',
		});
		await this.historyService.saveMessage(
			auth,
			input.courseId,
			'user',
			userMessage
		);
		await this.historyService.saveMessage(
			auth,
			input.courseId,
			'assistant',
			JSON.stringify(generatedModule)
		);

		return savedModule;
	}
}
