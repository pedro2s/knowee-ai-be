import { BillingPublicController } from './billing-public.controller';
import type { GetPublicPlansUseCase } from '../../application/use-cases/get-public-plans.usecase';

describe('BillingPublicController', () => {
	it('retorna os planos publicos sem autenticacao', async () => {
		const expected = {
			plans: [
				{
					id: 'premium',
					displayName: 'Premium',
					displayPrice: 'R$ 29',
					billingPeriod: '/mes',
					monthlyPrice: 29,
					annualPrice: 278.4,
					annualDiscountPercent: 20,
					description: 'Plano recomendado',
					features: ['Cursos ilimitados'],
					monthlyTokenLimit: 100000,
					isHighlighted: true,
					isContactOnly: false,
					supportChannel: 'email',
					supportSlaHours: 72,
				},
			],
			meta: {
				selfService: true,
				humanSupportPolicy: 'email_only_72h',
			},
		};

		const getPublicPlansUseCase = {
			execute: jest.fn().mockResolvedValue(expected),
		} as unknown as GetPublicPlansUseCase;

		const controller = new BillingPublicController(getPublicPlansUseCase);

		await expect(controller.getPublicPlans()).resolves.toEqual(expected);
	});
});
