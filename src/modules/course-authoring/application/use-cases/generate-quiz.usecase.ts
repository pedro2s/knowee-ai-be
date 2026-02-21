import {
	Inject,
	Injectable,
	NotFoundException,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/application/ports/token-usage.port';
import {
	QUIZ_GENERATOR,
	type QuizGeneratorPort,
} from '../../domain/ports/quiz-generator.port';
import { GenerateQuizDto } from '../dtos/generate-quiz.dto';
import { GeneratedQuiz } from '../../domain/entities/quiz.types';
import { AuthContext } from 'src/shared/application/ports/db-context.port';

@Injectable()
export class GenerateQuizUseCase {
	constructor(
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(QUIZ_GENERATOR)
		private readonly quizGenerator: QuizGeneratorPort
	) {}

	async execute(
		input: GenerateQuizDto,
		userId: string
	): Promise<GeneratedQuiz> {
		const { courseId, moduleId } = input;
		const authContext: AuthContext = {
			userId,
			role: 'authenticated',
		};

		const module = await this.moduleRepository.findById(moduleId, authContext);
		if (!module) {
			throw new NotFoundException('Módulo não encontrado');
		}

		const moduleData = module.toPrimitives();
		if (moduleData.courseId !== courseId) {
			throw new NotFoundException('Módulo não pertence ao curso informado');
		}

		const summary = await this.historyService.getSummary(authContext, courseId);
		const window = await this.historyService.getWindowMessages(
			authContext,
			courseId
		);

		const userMessage = `Módulo: ${JSON.stringify(
			moduleData
		)}\n\nCom base no módulo gere um quiz completo com 4 questões de múltipla escolha educativas e relevantes. Para cada questão, inclua: pergunta clara e específica, 4 opções de resposta bem elaboradas (sendo uma correta e três incorretas plausíveis), e uma explicação educativa da resposta correta.`;

		const { content: generatedQuiz, tokenUsage } =
			await this.quizGenerator.generateQuiz({
				input: {
					module: {
						id: moduleData.id,
						courseId: moduleData.courseId,
						title: moduleData.title,
						description: moduleData.description,
						orderIndex: moduleData.orderIndex,
						lessons: (moduleData.lessons || []).map((lesson) => ({
							id: lesson.id,
							title: lesson.title,
							description: lesson.description,
							lessonType: lesson.lessonType,
							orderIndex: lesson.orderIndex,
						})),
					},
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

		const normalizedQuestions = (generatedQuiz.quizQuestions || []).map(
			(question) => {
				if (!Array.isArray(question.options) || question.options.length !== 4) {
					throw new PreconditionFailedException(
						'A API da OpenAI retornou um quiz com opções inválidas.'
					);
				}

				if (
					typeof question.correctAnswer !== 'number' ||
					question.correctAnswer < 0 ||
					question.correctAnswer > 3
				) {
					throw new PreconditionFailedException(
						'A API da OpenAI retornou um índice de resposta correta inválido.'
					);
				}

				return {
					id: question.id || crypto.randomUUID(),
					question: question.question,
					options: question.options,
					correctAnswer: question.correctAnswer,
					explanation: question.explanation,
				};
			}
		);

		await this.historyService.saveMessage(
			authContext,
			courseId,
			'user',
			userMessage
		);

		const normalizedQuiz: GeneratedQuiz = {
			quizQuestions: normalizedQuestions,
		};

		await this.historyService.saveMessageAndSummarizeIfNecessary(
			authContext,
			courseId,
			'assistant',
			JSON.stringify(normalizedQuiz)
		);

		return normalizedQuiz;
	}
}
