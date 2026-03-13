import Stripe from 'stripe';
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('HandleStripeWebhookUseCase', () => {
	function build() {
		const stripe = {
			subscriptions: {
				retrieve: jest.fn(),
			},
		} as unknown as jest.Mocked<Stripe>;
		const usageRepository = {
			getLatestSubscriberForUser: jest.fn(),
			updateSubscriberById: jest.fn().mockResolvedValue(undefined),
			getSubscriptionTierByStripePriceId: jest.fn(),
			updateSubscriberByStripeSubscriptionId: jest
				.fn()
				.mockResolvedValue(undefined),
		} as unknown as jest.Mocked<UsageRepositoryPort>;

		return {
			stripe,
			usageRepository,
			useCase: new HandleStripeWebhookUseCase(stripe, usageRepository),
		};
	}

	it('deve atualizar subscriber ao concluir checkout pago', async () => {
		const { useCase, usageRepository } = build();
		usageRepository.getLatestSubscriberForUser.mockResolvedValue({
			id: 'subscriber-1',
			status: 'free',
			subscriptionTierId: 1,
			stripeCustomerId: null,
			stripeSubscriptionId: null,
		});

		await useCase.execute({
			type: 'checkout.session.completed',
			data: {
				object: {
					metadata: {
						user_id: 'user-1',
						subscription_tier_id: '2',
					},
					customer: 'cus_123',
					subscription: 'sub_123',
					payment_status: 'paid',
				},
			},
		} as never);

		expect(usageRepository.updateSubscriberById).toHaveBeenCalledWith(
			'subscriber-1',
			{
				stripeCustomerId: 'cus_123',
				stripeSubscriptionId: 'sub_123',
				subscriptionTierId: 2,
				status: 'active',
			}
		);
	});

	it('deve ignorar checkout sem user_id', async () => {
		const { useCase, usageRepository } = build();

		await useCase.execute({
			type: 'checkout.session.completed',
			data: {
				object: { metadata: {} },
			},
		} as never);

		expect(usageRepository.updateSubscriberById).not.toHaveBeenCalled();
	});

	it('deve atualizar status e tier no invoice.paid', async () => {
		const { useCase, stripe, usageRepository } = build();
		stripe.subscriptions.retrieve.mockResolvedValue({
			items: {
				data: [
					{
						price: { id: 'price_123' },
						current_period_end: 1_800_000_000,
					},
				],
			},
		} as never);
		usageRepository.getSubscriptionTierByStripePriceId.mockResolvedValue({
			id: 7,
			name: 'premium',
			monthlyTokenLimit: 1000,
			price: '29.00',
			stripePriceId: 'price_123',
			stripePriceIdAnnual: null,
		});

		await useCase.execute({
			type: 'invoice.paid',
			data: {
				object: {
					parent: {
						subscription_details: {
							subscription: 'sub_123',
						},
					},
				},
			},
		} as never);

		expect(
			usageRepository.updateSubscriberByStripeSubscriptionId
		).toHaveBeenCalledWith(
			'sub_123',
			expect.objectContaining({
				status: 'active',
				subscriptionTierId: 7,
				subscriptionEnd: '2027-01-15T08:00:00.000Z',
			})
		);
	});

	it('deve mapear subscription.updated e deleted', async () => {
		const { useCase, usageRepository } = build();
		usageRepository.getSubscriptionTierByStripePriceId.mockResolvedValue({
			id: 9,
			name: 'premium',
			monthlyTokenLimit: 1000,
			price: '29.00',
			stripePriceId: 'price_123',
			stripePriceIdAnnual: null,
		});

		await useCase.execute({
			type: 'customer.subscription.updated',
			data: {
				object: {
					id: 'sub_123',
					status: 'unpaid',
					items: {
						data: [
							{
								price: { id: 'price_123' },
								current_period_end: 1_800_000_000,
							},
						],
					},
				},
			},
		} as never);
		await useCase.execute({
			type: 'customer.subscription.deleted',
			data: {
				object: {
					id: 'sub_456',
					items: {
						data: [],
					},
					cancel_at: null,
					ended_at: 1_800_000_100,
				},
			},
		} as never);

		expect(
			usageRepository.updateSubscriberByStripeSubscriptionId
		).toHaveBeenNthCalledWith(
			1,
			'sub_123',
			expect.objectContaining({
				status: 'past_due',
				subscriptionTierId: 9,
			})
		);
		expect(
			usageRepository.updateSubscriberByStripeSubscriptionId
		).toHaveBeenNthCalledWith(
			2,
			'sub_456',
			expect.objectContaining({
				status: 'canceled',
				subscriptionEnd: '2027-01-15T08:01:40.000Z',
			})
		);
	});
});
