import { GenerateTextUseCase } from './generate-text.usecase';
import type { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import type { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';
import type { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

describe('GenerateTextUseCase', () => {
	it('deve usar o provider default, registrar tokens e salvar historico', async () => {
		const generate = jest.fn().mockResolvedValue({
			content: { text: 'Texto gerado' },
			tokenUsage: { totalTokens: 42, model: 'gpt-test' },
		});
		const providerRegistry = {
			getTextGeneratorStrategy: jest.fn().mockReturnValue({ generate }),
		} as unknown as jest.Mocked<ProviderRegistry>;
		const historyService = {
			getSummary: jest.fn().mockResolvedValue('Resumo'),
			getWindowMessages: jest.fn().mockResolvedValue([]),
			saveMessage: jest.fn().mockResolvedValue(undefined),
			saveMessageAndSummarizeIfNecessary: jest
				.fn()
				.mockResolvedValue(undefined),
		} as unknown as jest.Mocked<HistoryServicePort>;
		const tokenUsageService = {
			save: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<TokenUsagePort>;

		const useCase = new GenerateTextUseCase(
			providerRegistry,
			historyService,
			tokenUsageService
		);

		await expect(
			useCase.execute(
				{
					courseId: 'course-1',
					prompt: 'Explique closures',
				},
				'user-1'
			)
		).resolves.toEqual({ text: 'Texto gerado' });
		expect(providerRegistry.getTextGeneratorStrategy).toHaveBeenCalledWith(
			'openai'
		);
		expect(generate).toHaveBeenCalledWith({
			input: { prompt: 'Explique closures' },
			summary: 'Resumo',
			recentHistory: [],
		});
		expect(tokenUsageService.save).toHaveBeenCalledWith(
			'user-1',
			42,
			'gpt-test'
		);
		expect(historyService.saveMessage).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'user',
			'Explique closures'
		);
		expect(
			historyService.saveMessageAndSummarizeIfNecessary
		).toHaveBeenCalledWith(
			{ userId: 'user-1', role: 'authenticated' },
			'course-1',
			'assistant',
			'Texto gerado'
		);
	});

	it('nao deve registrar tokens quando o provider nao os retornar', async () => {
		const generate = jest.fn().mockResolvedValue({
			content: { text: 'Texto gerado' },
			tokenUsage: undefined,
		});
		const providerRegistry = {
			getTextGeneratorStrategy: jest.fn().mockReturnValue({ generate }),
		} as unknown as jest.Mocked<ProviderRegistry>;
		const historyService = {
			getSummary: jest.fn().mockResolvedValue(undefined),
			getWindowMessages: jest.fn().mockResolvedValue([]),
			saveMessage: jest.fn().mockResolvedValue(undefined),
			saveMessageAndSummarizeIfNecessary: jest
				.fn()
				.mockResolvedValue(undefined),
		} as unknown as jest.Mocked<HistoryServicePort>;
		const tokenUsageService = {
			save: jest.fn(),
		} as unknown as jest.Mocked<TokenUsagePort>;

		const useCase = new GenerateTextUseCase(
			providerRegistry,
			historyService,
			tokenUsageService
		);

		await useCase.execute(
			{
				courseId: 'course-1',
				prompt: 'Explique closures',
				ai: { provider: 'openai' },
			},
			'user-1'
		);

		expect(tokenUsageService.save).not.toHaveBeenCalled();
	});
});
