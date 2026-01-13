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
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';

@Injectable()
export class GenerateModuleUseCase {
	private readonly logger = new Logger(GenerateModuleUseCase.name);

	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
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

		const authContext: AuthContext = {
			userId: userId,
			role: 'authenticated',
		};

		const course = await this.courseRepository.findById(
			input.courseId,
			authContext
		);

		if (!course) {
			throw new Error('Course not found');
		}

		const summary = await this.historyService.getSummary(
			authContext,
			input.courseId
		);
		const window = await this.historyService.getWindowMessages(
			authContext,
			input.courseId
		);

		const { content: generatedModule, tokenUsage } = await moduleGen.generate({
			input: {
				currentCourseStructure: {
					title: course.title,
					description: course?.description || '',
					modules: course.modules?.map((module) => ({
						title: module.title,
						description: module.description || '',
						orderIndex: module.orderIndex,
						lessons: module.lessons?.map((lesson) => ({
							title: lesson.title,
							description: lesson.description || '',
							orderIndex: lesson.orderIndex,
							lessonType: lesson.lessonType,
						})),
					})),
				},
			},
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
			authContext
		);

		// input stringify sem o files
		const userMessage = `Gere um modulo para o curso de título: ${course.title}\nDescrição do curso: ${course.description}`;
		await this.historyService.saveMessage(
			authContext,
			input.courseId,
			'user',
			userMessage
		);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			input.courseId,
			'assistant',
			JSON.stringify(generatedModule)
		);

		return savedModule;
	}
}
