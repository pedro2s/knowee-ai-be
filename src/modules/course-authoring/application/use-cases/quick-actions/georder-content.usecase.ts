import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/course-repository.port';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/lesson-repository.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from 'src/modules/course-authoring/domain/ports/module-repository.port';
import { REORDER_CONTENT_AGENT } from 'src/modules/course-authoring/domain/ports/reorder-content-agent.port';
import { OpenAIReorderContentAgentAdapter } from 'src/modules/course-authoring/infrastructure/providers/openai/openai-reorder-content-agent.adapter';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';

@Injectable()
export class ReorderContentUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(REORDER_CONTENT_AGENT)
		private readonly openAIReorderContentAgent: OpenAIReorderContentAgentAdapter
	) {}

	async execute(courseId: string, userId: string): Promise<void> {
		console.log('courseId', courseId, 'userId', userId);
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

		const { content: reorderedCourse, tokenUsage } =
			await this.openAIReorderContentAgent.reorderContent({
				input: {
					id: primitive.id,
					title: primitive.title,
					description: primitive.description || '',
					modules: primitive.modules!.map((module) => ({
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

				summary: summary || '',
				recentHistory: window,
			});

		// salvar histórico de reordenação ou atualizar o curso com a nova ordem
		const userMessage = `Reordene o conteúdo do curso "${course.title}".`;
		await this.historyService.saveMessage(
			authContext,
			courseId,
			'user',
			userMessage
		);

		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			courseId,
			'system',
			JSON.stringify(reorderedCourse)
		);

		// Salvar o curso reordenado
		for (const module of reorderedCourse.modules || []) {
			for (const lesson of module.lessons || []) {
				await this.lessonRepository.update(
					lesson.id,
					{ orderIndex: lesson.orderIndex },
					authContext
				);
			}

			await this.moduleRepository.update(
				module.id,
				{ orderIndex: module.orderIndex },
				authContext
			);
		}
	}
}
