import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { GenerateModuleDto } from '../dtos/generate-module.dto';
import { Module } from '../../domain/entities/module.entity';
import { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import { LessonRepositoryPort } from '../../domain/ports/lesson-repository.port';
import { CourseRepositoryPort } from '../../domain/ports/course-repository.port';

@Injectable()
export class GenerateModuleUseCase {
	private readonly logger = new Logger(GenerateModuleUseCase.name);

	constructor(
		private readonly courseRepository: CourseRepositoryPort,
		private readonly moduleRepository: ModuleRepositoryPort,
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly tokenUsageService: TokenUsagePort,
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
			throw new NotFoundException('Curso não encontrado');
		}

		const summary = await this.historyService.getSummary(
			input.courseId,
			authContext
		);
		const window = await this.historyService.getWindowMessages(
			input.courseId,
			authContext
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
			input.courseId,
			'user',
			userMessage,
			authContext
		);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			input.courseId,
			'assistant',
			JSON.stringify(generatedModule),
			authContext
		);

		return savedModule;
	}
}
