import { NotFoundException } from '@nestjs/common';
import { ReorderContentUseCase } from './georder-content.usecase';
import type { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';
import type { ModuleRepositoryPort } from 'src/modules/course-authoring/domain/ports/module-repository.port';
import type { HistoryServicePort } from 'src/shared/history/application/ports/history-service.port';
import type {
	ReorderContentAgentPort,
	ReorderedContentResult,
} from 'src/modules/course-authoring/domain/ports/reorder-content-agent.port';
import type { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

describe('ReorderContentUseCase', () => {
	let useCase: ReorderContentUseCase;
	let courseRepository: jest.Mocked<CourseRepositoryPort>;
	let moduleRepository: jest.Mocked<ModuleRepositoryPort>;
	let historyService: jest.Mocked<HistoryServicePort>;
	let reorderContentAgent: jest.Mocked<ReorderContentAgentPort>;
	let tokenUsageService: jest.Mocked<TokenUsagePort>;
	let reorderContentMock: jest.Mock;
	let tokenUsageSaveMock: jest.Mock;
	let saveMessageMock: jest.Mock;
	let saveMessageAndSummarizeIfNecessaryMock: jest.Mock;
	let updateModuleMock: jest.Mock;

	beforeEach(() => {
		reorderContentMock = jest.fn();
		tokenUsageSaveMock = jest.fn();
		saveMessageMock = jest.fn();
		saveMessageAndSummarizeIfNecessaryMock = jest.fn();
		updateModuleMock = jest.fn();

		courseRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByUserId: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			saveCourseTree: jest.fn(),
		};

		moduleRepository = {
			create: jest.fn(),
			save: jest.fn(),
			findById: jest.fn(),
			findAllByCourseId: jest.fn(),
			update: updateModuleMock,
			delete: jest.fn(),
			saveModuleTree: jest.fn(),
		};

		historyService = {
			getWindowMessages: jest.fn(),
			getSummary: jest.fn(),
			shouldSummarizeHistory: jest.fn(),
			saveMessage: saveMessageMock,
			saveMessageAndSummarizeIfNecessary:
				saveMessageAndSummarizeIfNecessaryMock,
			summarizeHistory: jest.fn(),
		};

		reorderContentAgent = {
			reorderContent: reorderContentMock,
		};

		tokenUsageService = {
			save: tokenUsageSaveMock,
		};

		useCase = new ReorderContentUseCase(
			courseRepository,
			moduleRepository,
			historyService,
			tokenUsageService,
			reorderContentAgent
		);
	});

	it('deve chamar o agente, salvar histórico, salvar token usage e atualizar apenas módulos', async () => {
		const course = {
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso Teste',
				description: 'Descricao',
				modules: [
					{
						id: 'module-1',
						title: 'M1',
						description: 'D1',
						orderIndex: 0,
						lessons: [
							{
								id: 'lesson-1',
								title: 'L1',
								description: 'LD1',
								orderIndex: 0,
								lessonType: 'article',
							},
						],
					},
					{
						id: 'module-2',
						title: 'M2',
						description: 'D2',
						orderIndex: 1,
						lessons: [],
					},
				],
			}),
		} as any;

		courseRepository.findById.mockResolvedValue(course);
		historyService.getSummary.mockResolvedValue('Resumo');
		historyService.getWindowMessages.mockResolvedValue([] as any);

		const reorderedContent: ReorderedContentResult = {
			modules: [
				{ id: 'module-1', orderIndex: 1 },
				{ id: 'module-2', orderIndex: 0 },
			],
		};
		reorderContentMock.mockResolvedValue({
			content: reorderedContent,
			tokenUsage: { totalTokens: 123, model: 'gpt-4.1' },
		});
		updateModuleMock.mockResolvedValue(null);
		saveMessageMock.mockResolvedValue();
		saveMessageAndSummarizeIfNecessaryMock.mockResolvedValue();
		tokenUsageSaveMock.mockResolvedValue();

		await useCase.execute('course-1', 'user-1');

		expect(reorderContentMock).toHaveBeenCalledWith(
			expect.objectContaining({
				input: expect.objectContaining({
					id: 'course-1',
					modules: expect.arrayContaining([
						expect.objectContaining({ id: 'module-1' }),
					]),
				}),
				summary: 'Resumo',
			})
		);

		expect(tokenUsageSaveMock).toHaveBeenCalledWith('user-1', 123, 'gpt-4.1');
		expect(saveMessageMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'user',
			expect.any(String)
		);
		expect(saveMessageAndSummarizeIfNecessaryMock).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'assistant',
			JSON.stringify(reorderedContent)
		);
		expect(updateModuleMock).toHaveBeenCalledTimes(2);
		expect(updateModuleMock).toHaveBeenNthCalledWith(
			1,
			'module-1',
			{ orderIndex: 1 },
			{ userId: 'user-1', role: 'authenticated' }
		);
		expect(updateModuleMock).toHaveBeenNthCalledWith(
			2,
			'module-2',
			{ orderIndex: 0 },
			{ userId: 'user-1', role: 'authenticated' }
		);
	});

	it('deve lançar NotFoundException quando curso não existir', async () => {
		courseRepository.findById.mockResolvedValue(null);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new NotFoundException('Curso não encontrado')
		);
	});

	it('deve lançar NotFoundException quando curso não possuir módulos', async () => {
		const course = {
			toPrimitives: () => ({
				id: 'course-1',
				title: 'Curso Teste',
				description: 'Descricao',
				modules: [],
			}),
		} as any;
		courseRepository.findById.mockResolvedValue(course);

		await expect(useCase.execute('course-1', 'user-1')).rejects.toThrow(
			new NotFoundException('O curso não possui módulos para reordenar')
		);
	});
});
