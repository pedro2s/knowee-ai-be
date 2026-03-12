import { BillingController } from './billing.controller';
import type { GetUsageUseCase } from '../../application/use-cases/get-usage.usecase';
import type { GetSubscriptionUseCase } from '../../application/use-cases/get-subscription.usecase';
import type { CreateFreeSubscriptionUseCase } from '../../application/use-cases/create-free-subscription.usecase';
import type { GetUserEntitlementsUseCase } from 'src/modules/access-control/application/use-cases/get-user-entitlements.usecase';
import type { CreateCheckoutSessionUseCase } from '../../application/use-cases/create-checkout-session.usecase';

describe('BillingController', () => {
	it('deve delegar endpoints de billing aos respectivos use cases', async () => {
		const getUsageUseCase = {
			execute: jest.fn().mockResolvedValue({ used: 12 }),
		} as unknown as jest.Mocked<GetUsageUseCase>;
		const getSubscriptionUseCase = {
			execute: jest.fn().mockResolvedValue({
				status: 'active',
				subscription_tier: null,
				subscription_end: null,
				stripe_customer_id: 'cus_123',
			}),
		} as unknown as jest.Mocked<GetSubscriptionUseCase>;
		const createFreeSubscriptionUseCase = {
			execute: jest.fn().mockResolvedValue({
				status: 'free',
				subscription_tier: null,
				subscription_end: null,
				stripe_customer_id: null,
			}),
		} as unknown as jest.Mocked<CreateFreeSubscriptionUseCase>;
		const getUserEntitlementsUseCase = {
			execute: jest.fn().mockResolvedValue({
				planName: 'free',
				hasActiveSubscription: false,
				subscriptionId: null,
				monthlyTokenLimit: 10,
				usedTokensInPeriod: 2,
				remainingTokensInPeriod: 8,
				sampleConsumed: false,
				sampleGenerationCount: 0,
				freemiumScope: {
					sampleCourseId: null,
					firstModuleId: null,
					firstLessonId: null,
				},
				capabilities: {
					canCreateCourse: true,
					canAccessPlatform: true,
					canUseAI: true,
					canGenerateAssets: false,
					canExport: false,
				},
			}),
		} as unknown as jest.Mocked<GetUserEntitlementsUseCase>;
		const createCheckoutSessionUseCase = {
			execute: jest.fn().mockResolvedValue({ url: 'https://checkout.test' }),
		} as unknown as jest.Mocked<CreateCheckoutSessionUseCase>;
		const controller = new BillingController(
			getUsageUseCase,
			getSubscriptionUseCase,
			createFreeSubscriptionUseCase,
			getUserEntitlementsUseCase,
			createCheckoutSessionUseCase
		);
		const user = {
			id: 'user-1',
			email: 'user@example.com',
		} as never;

		await expect(controller.getUsage(user)).resolves.toEqual({ used: 12 });
		await expect(controller.getSubscription(user)).resolves.toEqual({
			status: 'active',
			subscription_tier: null,
			subscription_end: null,
			stripe_customer_id: 'cus_123',
		});
		await expect(controller.getEntitlements(user)).resolves.toMatchObject({
			planName: 'free',
			remainingTokensInPeriod: 8,
		});
		await expect(controller.createFreeSubscription(user)).resolves.toEqual({
			message: 'Plano gratuito ativado',
			subscription: {
				status: 'free',
				subscription_tier: null,
				subscription_end: null,
				stripe_customer_id: null,
			},
		});
		await expect(
			controller.checkout(user, { plan: 'premium', billingCycle: 'annual' })
		).resolves.toEqual({ url: 'https://checkout.test' });

		expect(createCheckoutSessionUseCase.execute).toHaveBeenCalledWith({
			userId: 'user-1',
			email: 'user@example.com',
			planName: 'premium',
			billingCycle: 'annual',
		});
	});
});
