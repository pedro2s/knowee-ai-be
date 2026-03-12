import { GetSubscriptionUseCase } from './get-subscription.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('GetSubscriptionUseCase', () => {
	it('deve retornar a subscription default quando o repositorio nao achar dados', async () => {
		const usageRepository = {
			getSubscription: jest.fn().mockResolvedValue(null),
		} as unknown as jest.Mocked<UsageRepositoryPort>;
		const useCase = new GetSubscriptionUseCase(usageRepository);

		await expect(useCase.execute('user-1')).resolves.toEqual({
			status: 'free',
			subscription_tier: null,
			subscription_end: null,
			stripe_customer_id: null,
		});
	});

	it('deve retornar a subscription do repositorio quando existir', async () => {
		const usageRepository = {
			getSubscription: jest.fn().mockResolvedValue({
				status: 'active',
				subscription_tier: {
					id: 1,
					name: 'premium',
					monthlyTokenLimit: 1000,
					price: '29.00',
					annualPrice: '290.00',
					stripePriceId: 'price_1',
					stripePriceIdAnnual: 'price_2',
				},
				subscription_end: '2026-04-01T00:00:00.000Z',
				stripe_customer_id: 'cus_123',
			}),
		} as unknown as jest.Mocked<UsageRepositoryPort>;
		const useCase = new GetSubscriptionUseCase(usageRepository);

		await expect(useCase.execute('user-1')).resolves.toEqual({
			status: 'active',
			subscription_tier: {
				id: 1,
				name: 'premium',
				monthlyTokenLimit: 1000,
				price: '29.00',
				annualPrice: '290.00',
				stripePriceId: 'price_1',
				stripePriceIdAnnual: 'price_2',
			},
			subscription_end: '2026-04-01T00:00:00.000Z',
			stripe_customer_id: 'cus_123',
		});
	});
});
