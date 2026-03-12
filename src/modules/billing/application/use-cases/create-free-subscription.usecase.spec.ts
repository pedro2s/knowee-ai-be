import { CreateFreeSubscriptionUseCase } from './create-free-subscription.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('CreateFreeSubscriptionUseCase', () => {
	it('deve delegar a criacao da assinatura gratuita', async () => {
		const usageRepository = {
			createFreeSubscription: jest.fn().mockResolvedValue({
				status: 'free',
				subscription_tier: null,
				subscription_end: null,
				stripe_customer_id: null,
			}),
		} as unknown as jest.Mocked<UsageRepositoryPort>;
		const useCase = new CreateFreeSubscriptionUseCase(usageRepository);

		await expect(
			useCase.execute('user-1', 'user@example.com')
		).resolves.toEqual({
			status: 'free',
			subscription_tier: null,
			subscription_end: null,
			stripe_customer_id: null,
		});
		expect(usageRepository.createFreeSubscription).toHaveBeenCalledWith(
			'user-1',
			'user@example.com'
		);
	});
});
