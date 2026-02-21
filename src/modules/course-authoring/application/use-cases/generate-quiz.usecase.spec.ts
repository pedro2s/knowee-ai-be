import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { GenerateQuizUseCase } from './generate-quiz.usecase';
import type { ModuleRepositoryPort } from '../../domain/ports/module-repository.port';
import type { HistoryServicePort } from 'src/modules/history/application/ports/history-service.port';
import type { TokenUsagePort } from 'src/shared/application/ports/token-usage.port';
import type { QuizGeneratorPort } from '../../domain/ports/quiz-generator.port';

describe('GenerateQuizUseCase', () => {
	let useCase: GenerateQuizUseCase;
	let moduleRepository: jest.Mocked<ModuleRepositoryPort>;
	let historyService: jest.Mocked<HistoryServicePort>;
	let tokenUsageService: jest.Mocked<TokenUsagePort>;
	let quizGenerator: jest.Mocked<QuizGeneratorPort>;
	let generateQuizMock: jest.Mock;
	let saveMessageMock: jest.Mock;
	let saveMessageAndSummarizeMock: jest.Mock;
	let saveTokenUsageMock: jest.Mock;

	beforeEach(() => {
		generateQuizMock = jest.fn();
		saveMessageMock = jest.fn();
		saveMessageAndSummarizeMock = jest.fn();
		saveTokenUsageMock = jest.fn();

		moduleRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByCourseId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveModuleTree: jest.fn(),
		};

		historyService = {
			getWindowMessages: jest.fn(),
			getSummary: jest.fn(),
			shouldSummarizeHistory: jest.fn(),
			saveMessage: saveMessageMock,
			saveMessageAndSummarizeIfNecessary: saveMessageAndSummarizeMock,
			summarizeHistory: jest.fn(),
		};

		tokenUsageService = {
			save: saveTokenUsageMock,
		};

		quizGenerator = {
			generateQuiz: generateQuizMock,
		};

		useCase = new GenerateQuizUseCase(
			moduleRepository,
			historyService,
			tokenUsageService,
			quizGenerator
		);
	});

	it('deve gerar quiz, salvar token usage e histórico e garantir ids', async () => {
		moduleRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'module-1',
				courseId: 'course-1',
				title: 'Modulo 1',
				description: 'Desc',
				orderIndex: 0,
				lessons: [
					{
						id: 'lesson-1',
						title: 'Aula 1',
						description: 'Desc aula',
						lessonType: 'article',
						orderIndex: 0,
					},
				],
			}),
		} as never);
		historyService.getSummary.mockResolvedValue('Resumo');
		historyService.getWindowMessages.mockResolvedValue([] as never);
		generateQuizMock.mockResolvedValue({
			content: {
				quizQuestions: [
					{
						question: 'Pergunta 1',
						options: ['A', 'B', 'C', 'D'],
						correctAnswer: 1,
						explanation: 'Explicação 1',
					},
				],
			},
			tokenUsage: { totalTokens: 120, model: 'gpt-4.1' },
		});

		const result = await useCase.execute(
			{ courseId: 'course-1', moduleId: 'module-1' },
			'user-1'
		);

		expect(generateQuizMock).toHaveBeenCalledWith(
			expect.objectContaining({
				summary: 'Resumo',
				input: expect.objectContaining({
					module: expect.objectContaining({ id: 'module-1' }),
				}),
			})
		);
		expect(saveTokenUsageMock).toHaveBeenCalledWith('user-1', 120, 'gpt-4.1');
		expect(saveMessageMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'user',
			expect.stringContaining('Módulo:')
		);
		expect(saveMessageAndSummarizeMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'assistant',
			expect.any(String)
		);
		expect(result.quizQuestions[0].id).toBeDefined();
	});

	it('deve lançar NotFoundException quando módulo não existir', async () => {
		moduleRepository.findById.mockResolvedValue(null);

		await expect(
			useCase.execute({ courseId: 'course-1', moduleId: 'module-1' }, 'user-1')
		).rejects.toThrow(new NotFoundException('Módulo não encontrado'));
	});

	it('deve lançar NotFoundException quando módulo não pertencer ao curso', async () => {
		moduleRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'module-1',
				courseId: 'course-2',
				title: 'Modulo 1',
				description: 'Desc',
				orderIndex: 0,
				lessons: [],
			}),
		} as never);

		await expect(
			useCase.execute({ courseId: 'course-1', moduleId: 'module-1' }, 'user-1')
		).rejects.toThrow(
			new NotFoundException('Módulo não pertence ao curso informado')
		);
	});

	it('deve lançar PreconditionFailedException para quiz com opções inválidas', async () => {
		moduleRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'module-1',
				courseId: 'course-1',
				title: 'Modulo 1',
				description: 'Desc',
				orderIndex: 0,
				lessons: [],
			}),
		} as never);
		historyService.getSummary.mockResolvedValue(undefined);
		historyService.getWindowMessages.mockResolvedValue([] as never);
		generateQuizMock.mockResolvedValue({
			content: {
				quizQuestions: [
					{
						id: 'q1',
						question: 'Pergunta 1',
						options: ['A', 'B'],
						correctAnswer: 0,
						explanation: 'Explicação 1',
					},
				],
			},
		});

		await expect(
			useCase.execute({ courseId: 'course-1', moduleId: 'module-1' }, 'user-1')
		).rejects.toThrow(
			new PreconditionFailedException(
				'A API da OpenAI retornou um quiz com opções inválidas.'
			)
		);
	});
});
