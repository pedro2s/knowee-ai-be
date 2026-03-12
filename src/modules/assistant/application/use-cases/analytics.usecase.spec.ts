import { AnalyticsUseCase } from './analytics.usecase';
import type { OpenAIAnalyticsAdapter } from '../../infrastructure/providers/openai/openai-analytics.adapter';

describe('AnalyticsUseCase', () => {
	it('deve delegar a analise para o adapter', async () => {
		const openAIAnalyticsAdapter = {
			analyze: jest.fn().mockResolvedValue({
				targetAudience: 'Beginners',
				suggestedModules: ['Intro'],
			}),
		} as unknown as jest.Mocked<OpenAIAnalyticsAdapter>;

		const useCase = new AnalyticsUseCase(openAIAnalyticsAdapter);

		await expect(
			useCase.execute({ title: 'Curso', description: 'Descricao' })
		).resolves.toEqual({
			targetAudience: 'Beginners',
			suggestedModules: ['Intro'],
		});
		expect(openAIAnalyticsAdapter.analyze).toHaveBeenCalledWith({
			title: 'Curso',
			description: 'Descricao',
		});
	});
});
