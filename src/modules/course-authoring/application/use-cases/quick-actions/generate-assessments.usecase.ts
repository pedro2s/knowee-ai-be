import {
	Inject,
	Injectable,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import { CourseRepositoryPort } from '../../../domain/ports/course-repository.port';
import { LessonRepositoryPort } from '../../../domain/ports/lesson-repository.port';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';
import {
	GENERATE_ASSESSMENTS_AGENT,
	type GenerateAssessmentsAgentPort,
} from '../../../domain/ports/generate-assessments-agent.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { Lesson } from '../../../domain/entities/lesson.entity';

@Injectable()
export class GenerateAssessmentsUseCase {
	constructor(
		private readonly courseRepository: CourseRepositoryPort,
		private readonly lessonRepository: LessonRepositoryPort,
		private readonly historyService: HistoryServicePort,
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(GENERATE_ASSESSMENTS_AGENT)
		private readonly generateAssessmentsAgent: GenerateAssessmentsAgentPort
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

		const courseData = course.toPrimitives();
		if (!courseData.modules || courseData.modules.length === 0) {
			throw new NotFoundException(
				'O curso não possui módulos para gerar avaliações'
			);
		}

		const summary = await this.historyService.getSummary(courseId, authContext);
		const window = await this.historyService.getWindowMessages(
			courseId,
			authContext
		);

		const userMessage = `Curso: ${JSON.stringify(
			courseData
		)}\n\nCrie sugestões de avaliações (quizzes, exercícios práticos, projetos) para este curso.

Para cada avaliação, retorne a estrutura de uma aula. Certifique-se de:
- Incluir títulos claros e objetivos claros nos títulos e descrição.
- Tipo de aula: quiz, pdf, external
- ID do Módulo válido para vincular a avaliação
- Ordenar para a última aula do módulo`;

		const { content: generatedAssessments, tokenUsage } =
			await this.generateAssessmentsAgent.generateAssessments({
				input: {
					course: {
						id: courseData.id,
						title: courseData.title,
						description: courseData.description,
						category: courseData.category,
						level: courseData.level,
						duration: courseData.duration,
						targetAudience: courseData.targetAudience,
						objectives: courseData.objectives,
						modules: courseData.modules.map((module) => ({
							id: module.id,
							title: module.title,
							description: module.description,
							orderIndex: module.orderIndex,
							lessons: (module.lessons || []).map((lesson) => ({
								id: lesson.id,
								title: lesson.title,
								description: lesson.description,
								lessonType: lesson.lessonType,
								orderIndex: lesson.orderIndex,
							})),
						})),
					},
				},
				summary: summary || null,
				recentHistory: window,
			});

		if (tokenUsage) {
			await this.tokenUsageService.record({
				userId: authContext.userId,
				courseId,
				...tokenUsage,
			});
		}

		await this.historyService.saveMessage(
			courseId,
			'user',
			userMessage,
			authContext
		);

		await this.historyService.saveMessageAndSummarizeIfNecessary(
			courseId,
			'assistant',
			JSON.stringify(generatedAssessments),
			authContext
		);

		const validModuleIds = new Set(
			courseData.modules.map((module) => module.id)
		);
		const nextOrderByModule = new Map<string, number>();
		for (const module of courseData.modules) {
			const maxOrder = (module.lessons || []).reduce(
				(max, lesson) => Math.max(max, lesson.orderIndex),
				-1
			);
			nextOrderByModule.set(module.id, maxOrder + 1);
		}

		for (const lesson of generatedAssessments.lessons || []) {
			if (!validModuleIds.has(lesson.moduleId)) {
				throw new PreconditionFailedException(
					`A API da OpenAI retornou moduleId inválido: ${lesson.moduleId}`
				);
			}

			if (!['quiz', 'pdf', 'external'].includes(lesson.lessonType)) {
				throw new PreconditionFailedException(
					`A API da OpenAI retornou lessonType inválido: ${lesson.lessonType}`
				);
			}

			const nextOrderIndex = nextOrderByModule.get(lesson.moduleId) ?? 0;

			const newLesson = Lesson.create({
				moduleId: lesson.moduleId,
				courseId,
				title: lesson.title,
				description: lesson.description,
				lessonType: lesson.lessonType,
				orderIndex: nextOrderIndex,
				content: null,
				assets: null,
			});

			await this.lessonRepository.create(newLesson, authContext);
			nextOrderByModule.set(lesson.moduleId, nextOrderIndex + 1);
		}
	}
}
