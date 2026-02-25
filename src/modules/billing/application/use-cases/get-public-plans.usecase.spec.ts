import { GetPublicPlansUseCase } from './get-public-plans.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('GetPublicPlansUseCase', () => {
	let useCase: GetPublicPlansUseCase;
	let usageRepository: jest.Mocked<UsageRepositoryPort>;

	beforeEach(() => {
		usageRepository = {
			getUsageInPeriod: jest.fn(),
			getActiveSubscription: jest.fn(),
			getLatestSubscriptionSnapshot: jest.fn(),
			getSubscription: jest.fn(),
			createFreeSubscription: jest.fn(),
			getSubscriptionTierByName: jest.fn(),
			getSubscriptionTierByStripePriceId: jest.fn(),
			listPublicSubscriptionTiers: jest.fn(),
			getLatestSubscriberForUser: jest.fn(),
			updateSubscriberById: jest.fn(),
			updateSubscriberByStripeSubscriptionId: jest.fn(),
		};

		useCase = new GetPublicPlansUseCase(usageRepository);
	});

	it('retorna planos ordenados pelo repository e meta de self-service', async () => {
		usageRepository.listPublicSubscriptionTiers.mockResolvedValue([
			{
				name: 'free',
				displayName: 'Gratuito',
				monthlyTokenLimit: 20000,
				price: '0.00',
				billingPeriod: null,
				description: 'Plano de entrada',
				features: ['1 curso de amostra'],
				isHighlighted: false,
				isContactOnly: false,
				sortOrder: 1,
				supportChannel: 'email',
				supportSlaHours: 72,
			},
			{
				name: 'enterprise',
				displayName: 'Empresarial',
				monthlyTokenLimit: 2000000,
				price: null,
				billingPeriod: null,
				description: 'Sob consulta',
				features: ['White-label'],
				isHighlighted: false,
				isContactOnly: true,
				sortOrder: 4,
				supportChannel: 'email',
				supportSlaHours: 72,
			},
		]);

		const result = await useCase.execute();

		expect(result.meta).toEqual({
			selfService: true,
			humanSupportPolicy: 'email_only_72h',
		});
		expect(result.plans).toHaveLength(2);
		expect(result.plans[0]).toMatchObject({
			id: 'free',
			displayName: 'Gratuito',
			displayPrice: 'R$ 0',
		});
		expect(result.plans[1]).toMatchObject({
			id: 'enterprise',
			displayPrice: 'Sob consulta',
			isContactOnly: true,
		});
	});
});
