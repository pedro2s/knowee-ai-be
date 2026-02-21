import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import type { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';
import type { LessonRepositoryPort } from 'src/modules/course-authoring/domain/ports/lesson-repository.port';
import type { HistoryServicePort } from 'src/modules/history/application/ports/history-service.port';
import type { TokenUsagePort } from 'src/shared/application/ports/token-usage.port';
import type { GenerateAssessmentsAgentPort } from 'src/modules/course-authoring/domain/ports/generate-assessments-agent.port';
import { GenerateAssessmentsUseCase } from './generate-assessments.usecase';

describe('GenerateAssessmentsUseCase', () => {
	let useCase: GenerateAssessmentsUseCase;
	let courseRepository: jest.Mocked<CourseRepositoryPort>;
	let lessonRepository: jest.Mocked<LessonRepositoryPort>;
	let historyService: jest.Mocked<HistoryServicePort>;
	let tokenUsageService: jest.Mocked<TokenUsagePort>;
	let assessmentsAgent: jest.Mocked<GenerateAssessmentsAgentPort>;
	let generateAssessmentsMock: jest.Mock;
	let createLessonMock: jest.MockedFunction<LessonRepositoryPort['create']>;
	let saveTokenUsageMock: jest.Mock;
	let saveMessageMock: jest.Mock;
	let saveMessageAndSummarizeMock: jest.Mock;

	beforeEach(() => {
		generateAssessmentsMock = jest.fn();
		createLessonMock = jest.fn();
		saveTokenUsageMock = jest.fn();
		saveMessageMock = jest.fn();
		saveMessageAndSummarizeMock = jest.fn();

		courseRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveCourseTree: jest.fn(),
		};
		lessonRepository = {
			create: createLessonMock,
			findById: jest.fn(),
			findAllByModuleId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
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
		assessmentsAgent = {
			generateAssessments: generateAssessmentsMock,
		};

		useCase = new GenerateAssessmentsUseCase(
			courseRepository,
			lessonRepository,
			historyService,
			tokenUsageService,
			assessmentsAgent
		);
	});

	it('deve gerar avaliações, salvar token usage, histórico e criar aulas no final dos módulos', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso',
				description: 'Desc',
				category: 'Cat',
				level: 'Iniciante',
				duration: '2h',
				targetAudience: 'Todos',
				objectives: 'Obj',
				modules: [
					{
						id: 'module-1',
						title: 'M1',
						description: 'D1',
						orderIndex: 0,
						lessons: [
							{
								id: 'l1',
								title: 'A',
								description: null,
								lessonType: 'article',
								orderIndex: 0,
							},
						],
					},
				],
			}),
		} as never);
		historyService.getSummary.mockResolvedValue('Resumo');
		historyService.getWindowMessages.mockResolvedValue([] as never);
		generateAssessmentsMock.mockResolvedValue({
			content: {
				lessons: [
					{
						title: 'Quiz 1',
						description: 'Desc quiz',
						orderIndex: 999,
						moduleId: 'module-1',
						lessonType: 'quiz',
					},
				],
			},
			tokenUsage: { totalTokens: 300, model: 'gpt-4.1' },
		});
		createLessonMock.mockResolvedValue({} as never);

		await useCase.execute('course-1', 'user-1');

		expect(generateAssessmentsMock).toHaveBeenCalled();
		expect(saveTokenUsageMock).toHaveBeenCalledWith('user-1', 300, 'gpt-4.1');
		expect(saveMessageMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'user',
			expect.stringContaining('Crie sugestões de avaliações')
		);
		expect(createLessonMock).toHaveBeenCalledTimes(1);
		const [createdLessonInput] = createLessonMock.mock.calls[0];
		const createdLesson = createdLessonInput.toPrimitives();
		expect(createdLesson.courseId).toBe('course-1');
		expect(createdLesson.moduleId).toBe('module-1');
		expect(createdLesson.orderIndex).toBe(1);
		expect(saveMessageAndSummarizeMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'assistant',
			expect.any(String)
		);
	});

	it('deve lançar NotFoundException quando curso não existir', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new NotFoundException('Curso não encontrado')
		);
	});

	it('deve lançar NotFoundException quando curso não possuir módulos', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({ id: 'course-1', modules: [] }),
		} as never);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new NotFoundException('O curso não possui módulos para gerar avaliações')
		);
	});

	it('deve lançar PreconditionFailedException quando moduleId for inválido', async () => {
		courseRepository.findById.mockResolvedValue({
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso',
				description: 'Desc',
				category: 'Cat',
				level: 'Iniciante',
				duration: '2h',
				targetAudience: 'Todos',
				objectives: 'Obj',
				modules: [
					{
						id: 'module-1',
						title: 'M1',
						description: 'D1',
						orderIndex: 0,
						lessons: [],
					},
				],
			}),
		} as never);
		historyService.getSummary.mockResolvedValue(undefined);
		historyService.getWindowMessages.mockResolvedValue([] as never);
		generateAssessmentsMock.mockResolvedValue({
			content: {
				lessons: [
					{
						title: 'Quiz 1',
						description: 'Desc quiz',
						orderIndex: 0,
						moduleId: 'module-x',
						lessonType: 'quiz',
					},
				],
			},
		});

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new PreconditionFailedException(
				'A API da OpenAI retornou moduleId inválido: module-x'
			)
		);
	});
});
