import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/course-repository.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/module-repository.port';
import {
	REORDER_CONTENT_AGENT,
	type ReorderContentAgentPort,
} from 'src/modules/course-authoring/domain/ports/reorder-content-agent.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/application/ports/token-usage.port';

@Injectable()
export class ReorderContentUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(REORDER_CONTENT_AGENT)
		private readonly reorderContentAgent: ReorderContentAgentPort
	) {}

	async execute(courseId: string, userId: string): Promise<void> {
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};
		const course = await this.courseRepository.findById(courseId, authContext);

		if (!course) {
			throw new NotFoundException('Curso não encontrado');
		}

		const primitive = course.toPrimitives();

		if (primitive.modules?.length === 0) {
			throw new NotFoundException('O curso não possui módulos para reordenar');
		}

		const summary = await this.historyService.getSummary(authContext, courseId);
		const window = await this.historyService.getWindowMessages(
			authContext,
			courseId
		);

		const userMessage =
			'Analise a estrutura atual do curso e faça uma reordenação lógica dos módulos para melhor progressão de aprendizado.';
		const { content: reorderedContent, tokenUsage } =
			await this.reorderContentAgent.reorderContent({
				input: {
					id: primitive.id,
					title: primitive.title,
					description: primitive.description || '',
					modules: primitive.modules!.map((module) => ({
						id: module.id,
						title: module.title,
						description: module.description || '',
						orderIndex: module.orderIndex,
						lessons: module.lessons?.map((lesson) => ({
							id: lesson.id,
							title: lesson.title,
							description: lesson.description || '',
							orderIndex: lesson.orderIndex,
							lessonType: lesson.lessonType,
						})),
					})),
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

		// salvar histórico de reordenação ou atualizar o curso com a nova ordem
		await this.historyService.saveMessage(
			authContext,
			courseId,
			'user',
			userMessage
		);

		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			courseId,
			'assistant',
			JSON.stringify(reorderedContent)
		);

		for (const module of reorderedContent.modules || []) {
			await this.moduleRepository.update(
				module.id,
				{ orderIndex: module.orderIndex },
				authContext
			);
		}
	}
}
