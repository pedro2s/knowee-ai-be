import { AnalyticsUseCase } from './analytics.usecase';
import type { OpenAIAnalyticsAdapter } from '../../infrastructure/providers/openai/openai-analytics.adapter';
import type { TokenUsagePort } from 'src/shared/token-usage/domain/ports/token-usage.port';

describe('AnalyticsUseCase', () => {
	it('deve delegar a analise para o adapter', async () => {
		const openAIAnalyticsAdapter = {
			analyze: jest.fn().mockResolvedValue({
				analysis: {
					targetAudience: 'Beginners',
					suggestedModules: ['Intro'],
				},
				tokenUsage: {
					model: 'gpt-4.1-mini',
					totalTokens: 24,
				},
			}),
		} as unknown as jest.Mocked<OpenAIAnalyticsAdapter>;
		const tokenUsageService = {
			record: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<TokenUsagePort>;

		const useCase = new AnalyticsUseCase(
			openAIAnalyticsAdapter,
			tokenUsageService
		);

		await expect(
			useCase.execute({
				title: 'Curso',
				description: 'Descricao',
				userId: 'user-1',
			})
		).resolves.toEqual({
			targetAudience: 'Beginners',
			suggestedModules: ['Intro'],
		});
		expect(openAIAnalyticsAdapter.analyze).toHaveBeenCalledWith({
			title: 'Curso',
			description: 'Descricao',
			userId: 'user-1',
		});
		expect(tokenUsageService.record).toHaveBeenCalledWith({
			userId: 'user-1',
			model: 'gpt-4.1-mini',
			totalTokens: 24,
		});
	});
});
