jest.mock('uuid', () => ({
	v4: () => 'qa-generated-id',
}));

import { SubmitQuestionUseCase } from './submit-question.usecase';
import type { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import type { QuestionAnswerRepositoryPort } from '../../domain/ports/question-anwer-repository.port';
import type { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import type { AssistantPendingActionRepositoryPort } from '../../domain/ports/assistant-pending-action-repository.port';
import type { AssistantToolRegistry } from '../services/assistant-tool.registry';
import type { AssistantToolExecutor } from '../services/assistant-tool.executor';
import { AssistantPendingAction } from '../../domain/entities/assistant-pending-action.entity';
import type { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

describe('SubmitQuestionUseCase', () => {
	const buildUseCase = ({
		askResult = { content: { answer: 'Resposta da IA' } },
		pendingAction = null,
		toolValidation = null,
		executorResult = null,
		executorError = null,
	}: {
		askResult?: Record<string, unknown>;
		pendingAction?: AssistantPendingAction | null;
		toolValidation?: Record<string, unknown> | null;
		executorResult?: { summary: string; userMessage: string } | null;
		executorError?: Error | null;
	} = {}) => {
		const ask = jest.fn().mockResolvedValue(askResult);
		const providerRegistry = {
			getAIAssistantStrategy: jest.fn().mockReturnValue({ ask }),
		} as unknown as jest.Mocked<ProviderRegistry>;
		const questionAnswerRepository = {
			create: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<QuestionAnswerRepositoryPort>;
		const historyService = {
			getSummary: jest.fn().mockResolvedValue('Resumo'),
			getWindowMessages: jest.fn().mockResolvedValue([]),
			saveMessage: jest.fn().mockResolvedValue(undefined),
			saveMessageAndSummarizeIfNecessary: jest
				.fn()
				.mockResolvedValue(undefined),
		} as unknown as jest.Mocked<HistoryServicePort>;
		const pendingActionRepository = {
			findPendingByCourseId: jest.fn().mockResolvedValue(pendingAction),
			save: jest
				.fn()
				.mockImplementation((value: AssistantPendingAction) =>
					Promise.resolve(value)
				),
		} as unknown as jest.Mocked<AssistantPendingActionRepositoryPort>;
		const assistantToolRegistry = {
			getDefinitions: jest.fn().mockReturnValue([
				{
					name: 'create_module',
					description: 'Cria modulo',
					parameters: { type: 'object' },
				},
			]),
			validateToolCall: jest.fn().mockReturnValue(
				toolValidation ?? {
					success: false,
					error: 'Ferramenta inválida.',
				}
			),
		} as unknown as jest.Mocked<AssistantToolRegistry>;
		const assistantToolExecutor = {
			buildConfirmationMessage: jest
				.fn()
				.mockReturnValue(
					'Posso criar o módulo "M1". Responda "confirmar" para executar ou "cancelar" para abortar.'
				),
			execute: executorError
				? jest.fn().mockRejectedValue(executorError)
				: jest.fn().mockResolvedValue(
						executorResult ?? {
							summary: 'Módulo criado',
							userMessage: 'A ação foi executada com sucesso.',
						}
					),
		} as unknown as jest.Mocked<AssistantToolExecutor>;
		const tokenUsageService = {
			record: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<TokenUsagePort>;

		const useCase = new SubmitQuestionUseCase(
			providerRegistry,
			questionAnswerRepository,
			historyService,
			pendingActionRepository,
			assistantToolRegistry,
			assistantToolExecutor,
			tokenUsageService
		);

		return {
			useCase,
			ask,
			providerRegistry,
			questionAnswerRepository,
			historyService,
			pendingActionRepository,
			assistantToolRegistry,
			assistantToolExecutor,
			tokenUsageService,
		};
	};

	it('deve responder normalmente quando nao houver tool call', async () => {
		const {
			useCase,
			providerRegistry,
			ask,
			assistantToolRegistry,
			historyService,
			questionAnswerRepository,
			tokenUsageService,
		} = buildUseCase();

		await expect(
			useCase.execute(
				{ courseId: 'course-1', question: 'Como melhorar isso?' },
				'user-1'
			)
		).resolves.toEqual({
			answer: 'Resposta da IA',
			action: { status: 'none' },
		});

		expect(providerRegistry.getAIAssistantStrategy).toHaveBeenCalledWith(
			'openai'
		);
		expect(ask).toHaveBeenCalledWith({
			input: { question: 'Como melhorar isso?' },
			summary: 'Resumo',
			recentHistory: [],
			tools: assistantToolRegistry.getDefinitions(),
		});
		expect(historyService.saveMessage).toHaveBeenCalledWith(
			'course-1',
			'user',
			'Como melhorar isso?',
			{ userId: 'user-1', role: 'authenticated' }
		);
		expect(tokenUsageService.record).not.toHaveBeenCalled();
		expect(questionAnswerRepository.create).toHaveBeenCalled();
	});

	it('deve retornar mensagem deterministica para confirmar sem pending action', async () => {
		const { useCase, providerRegistry } = buildUseCase();

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'confirmar' }, 'user-1')
		).resolves.toEqual({
			answer: 'Não há nenhuma ação pendente para confirmar.',
			action: { status: 'none' },
		});

		expect(providerRegistry.getAIAssistantStrategy).not.toHaveBeenCalled();
	});

	it('deve retornar mensagem deterministica para cancelar sem pending action', async () => {
		const { useCase, providerRegistry } = buildUseCase();

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'cancelar' }, 'user-1')
		).resolves.toEqual({
			answer: 'Não há nenhuma ação pendente para cancelar.',
			action: { status: 'none' },
		});

		expect(providerRegistry.getAIAssistantStrategy).not.toHaveBeenCalled();
	});

	it('deve criar pending action quando a IA sugerir create_module', async () => {
		const invocation = {
			name: 'create_module',
			rawArguments: {
				module: {
					title: 'M1',
					order_index: 1,
					lessons: [],
				},
			},
			normalizedArguments: {
				courseId: 'course-1',
				title: 'M1',
				orderIndex: 1,
				description: '',
				lessons: [],
			},
		};
		const {
			useCase,
			assistantToolRegistry,
			pendingActionRepository,
			assistantToolExecutor,
		} = buildUseCase({
			askResult: {
				content: {
					answer: '',
					toolCall: {
						name: 'create_module',
						arguments: invocation.rawArguments,
					},
				},
			},
			toolValidation: {
				success: true,
				invocation,
			},
		});

		await expect(
			useCase.execute(
				{ courseId: 'course-1', question: 'Crie um módulo' },
				'user-1'
			)
		).resolves.toEqual({
			answer:
				'Posso criar o módulo "M1". Responda "confirmar" para executar ou "cancelar" para abortar.',
			action: {
				status: 'pending_confirmation',
				type: 'create_module',
				pendingActionId: expect.any(String),
			},
		});

		expect(assistantToolRegistry.validateToolCall).toHaveBeenCalledWith(
			{
				name: 'create_module',
				arguments: invocation.rawArguments,
			},
			{
				courseId: 'course-1',
			}
		);
		expect(assistantToolExecutor.buildConfirmationMessage).toHaveBeenCalledWith(
			invocation
		);
		expect(pendingActionRepository.save).toHaveBeenCalled();
	});

	it('deve executar a action pendente ao receber confirmar', async () => {
		const pendingAction = AssistantPendingAction.create({
			userId: 'user-1',
			courseId: 'course-1',
			toolName: 'create_module',
			argumentsJson: {
				module: {
					title: 'M1',
					order_index: 1,
					lessons: [],
				},
			},
			proposedAnswer: 'Confirma?',
			expiresAt: new Date(Date.now() + 10000),
		});
		const invocation = {
			name: 'create_module',
			rawArguments: pendingAction.argumentsJson,
			normalizedArguments: {
				courseId: 'course-1',
				title: 'M1',
				orderIndex: 1,
				description: '',
				lessons: [],
			},
		};
		const {
			useCase,
			pendingActionRepository,
			assistantToolExecutor,
			assistantToolRegistry,
		} = buildUseCase({
			pendingAction,
			toolValidation: { success: true, invocation },
			executorResult: {
				summary: 'Módulo M1 criado',
				userMessage: 'A ação foi executada com sucesso.',
			},
		});

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'confirmar' }, 'user-1')
		).resolves.toEqual({
			answer: 'A ação foi executada com sucesso.',
			action: {
				status: 'executed',
				type: 'create_module',
			},
		});

		expect(assistantToolExecutor.execute).toHaveBeenCalledWith(
			invocation,
			'user-1'
		);
		expect(pendingActionRepository.save).toHaveBeenCalledTimes(2);
		expect(assistantToolRegistry.validateToolCall).toHaveBeenCalledWith(
			{
				name: 'create_module',
				arguments: pendingAction.argumentsJson,
			},
			{ courseId: 'course-1' }
		);
	});

	it('deve usar o courseId do request mesmo sem course_id na tool', async () => {
		const invocation = {
			name: 'create_module',
			rawArguments: {
				module: {
					title: 'M1',
					order_index: 1,
					lessons: [],
				},
			},
			normalizedArguments: {
				courseId: 'course-1',
				title: 'M1',
				orderIndex: 1,
				description: '',
				lessons: [],
			},
		};
		const { useCase, assistantToolRegistry } = buildUseCase({
			askResult: {
				content: {
					answer: '',
					toolCall: {
						name: 'create_module',
						arguments: invocation.rawArguments,
					},
				},
			},
			toolValidation: {
				success: true,
				invocation,
			},
		});

		await useCase.execute(
			{ courseId: 'course-1', question: 'Crie um módulo' },
			'user-1'
		);

		expect(assistantToolRegistry.validateToolCall).toHaveBeenCalledWith(
			{
				name: 'create_module',
				arguments: invocation.rawArguments,
			},
			{ courseId: 'course-1' }
		);
	});

	it('deve rejeitar course_id divergente do curso atual', async () => {
		const { useCase, assistantToolRegistry } = buildUseCase({
			askResult: {
				content: {
					answer: '',
					toolCall: {
						name: 'create_module',
						arguments: {
							module: {
								title: 'M1',
								order_index: 1,
								course_id: 'other-course',
								lessons: [],
							},
						},
					},
				},
			},
			toolValidation: {
				success: false,
				error:
					'O course_id informado pela ferramenta não corresponde ao curso atual.',
			},
		});

		await expect(
			useCase.execute(
				{ courseId: 'course-1', question: 'Crie um módulo' },
				'user-1'
			)
		).resolves.toEqual({
			answer:
				'O course_id informado pela ferramenta não corresponde ao curso atual. Peça novamente com todos os parâmetros obrigatórios.',
			action: {
				status: 'failed',
				type: 'create_module',
			},
		});

		expect(assistantToolRegistry.validateToolCall).toHaveBeenCalledWith(
			{
				name: 'create_module',
				arguments: {
					module: {
						title: 'M1',
						order_index: 1,
						course_id: 'other-course',
						lessons: [],
					},
				},
			},
			{ courseId: 'course-1' }
		);
	});

	it('deve cancelar a action pendente', async () => {
		const pendingAction = AssistantPendingAction.create({
			userId: 'user-1',
			courseId: 'course-1',
			toolName: 'create_module',
			argumentsJson: { module: {} },
			proposedAnswer: 'Confirma?',
			expiresAt: new Date(Date.now() + 10000),
		});
		const { useCase, pendingActionRepository } = buildUseCase({
			pendingAction,
		});

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'cancelar' }, 'user-1')
		).resolves.toEqual({
			answer: 'A ação pendente foi cancelada.',
			action: {
				status: 'cancelled',
				type: 'create_module',
			},
		});

		expect(pendingActionRepository.save).toHaveBeenCalledTimes(1);
	});

	it('deve lembrar sobre action pendente quando a mensagem nao for confirmar nem cancelar', async () => {
		const pendingAction = AssistantPendingAction.create({
			userId: 'user-1',
			courseId: 'course-1',
			toolName: 'create_module',
			argumentsJson: { module: {} },
			proposedAnswer: 'Confirma?',
			expiresAt: new Date(Date.now() + 10000),
		});
		const { useCase, providerRegistry } = buildUseCase({
			pendingAction,
		});

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'e depois?' }, 'user-1')
		).resolves.toEqual({
			answer:
				'Confirma? Ainda há uma ação pendente aguardando confirmação. Responda "confirmar" ou "cancelar".',
			action: {
				status: 'pending_confirmation',
				type: 'create_module',
				pendingActionId: pendingAction.id,
			},
		});

		expect(providerRegistry.getAIAssistantStrategy).not.toHaveBeenCalled();
	});

	it('deve retornar falha quando os argumentos da tool forem invalidos', async () => {
		const { useCase, assistantToolRegistry, assistantToolExecutor } =
			buildUseCase({
				askResult: {
					content: {
						answer: '',
						toolCall: {
							name: 'create_module',
							arguments: { invalid: true },
						},
					},
				},
				toolValidation: {
					success: false,
					error:
						'O campo module.lessons.0.lesson_type é obrigatório e deve usar um destes valores exatos: video, audio, quiz, pdf, external, article.',
				},
			});

		await expect(
			useCase.execute(
				{ courseId: 'course-1', question: 'Crie um módulo' },
				'user-1'
			)
		).resolves.toEqual({
			answer:
				'O campo module.lessons.0.lesson_type é obrigatório e deve usar um destes valores exatos: video, audio, quiz, pdf, external, article. Peça novamente com todos os parâmetros obrigatórios.',
			action: {
				status: 'failed',
				type: 'create_module',
			},
		});

		expect(assistantToolRegistry.validateToolCall).toHaveBeenCalled();
		expect(assistantToolExecutor.execute).not.toHaveBeenCalled();
	});

	it('deve marcar como failed quando a execucao falhar', async () => {
		const pendingAction = AssistantPendingAction.create({
			userId: 'user-1',
			courseId: 'course-1',
			toolName: 'create_module',
			argumentsJson: { module: {} },
			proposedAnswer: 'Confirma?',
			expiresAt: new Date(Date.now() + 10000),
		});
		const invocation = {
			name: 'create_module',
			rawArguments: pendingAction.argumentsJson,
			normalizedArguments: {
				courseId: 'course-1',
				title: 'M1',
				orderIndex: 1,
				description: '',
				lessons: [],
			},
		};
		const { useCase, pendingActionRepository } = buildUseCase({
			pendingAction,
			toolValidation: { success: true, invocation },
			executorError: new Error('boom'),
		});

		await expect(
			useCase.execute({ courseId: 'course-1', question: 'confirmar' }, 'user-1')
		).resolves.toEqual({
			answer: 'Não consegui criar o módulo neste curso. Detalhe técnico: boom',
			action: {
				status: 'failed',
				type: 'create_module',
			},
		});

		expect(pendingActionRepository.save).toHaveBeenCalledTimes(2);
	});
});
