jest.mock('uuid', () => ({
	v4: () => 'qa-generated-id',
}));

import { SubmitQuestionUseCase } from './submit-question.usecase';
import type { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import type { QuestionAnswerRepositoryPort } from '../../domain/ports/question-anwer-repository.port';
import type { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';

describe('SubmitQuestionUseCase', () => {
	it('deve usar provider default, consultar historico e persistir pergunta e resposta', async () => {
		const ask = jest.fn().mockResolvedValue({
			content: { answer: 'Resposta da IA' },
			tokenUsage: { totalTokens: 12, model: 'gpt-test' },
		});
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

		const useCase = new SubmitQuestionUseCase(
			providerRegistry,
			questionAnswerRepository,
			historyService
		);

		await expect(
			useCase.execute(
				{ courseId: 'course-1', question: 'Como melhorar isso?' },
				'user-1'
			)
		).resolves.toEqual({ answer: 'Resposta da IA' });
		expect(providerRegistry.getAIAssistantStrategy).toHaveBeenCalledWith(
			'openai'
		);
		expect(ask).toHaveBeenCalledWith({
			input: { question: 'Como melhorar isso?' },
			summary: 'Resumo',
			recentHistory: [],
		});
		expect(historyService.saveMessage).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'user',
			'Como melhorar isso?'
		);
		expect(
			historyService.saveMessageAndSummarizeIfNecessary
		).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'assistant',
			'Resposta da IA'
		);
		expect(questionAnswerRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'user-1',
				courseId: 'course-1',
				question: 'Como melhorar isso?',
				answer: 'Resposta da IA',
			}),
			{ userId: 'user-1', role: 'authenticated' }
		);
	});
});
