import { BadRequestException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateCheckoutSessionUseCase } from './create-checkout-session.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('CreateCheckoutSessionUseCase', () => {
	let useCase: CreateCheckoutSessionUseCase;
	let usageRepository: jest.Mocked<UsageRepositoryPort>;
	let stripe: jest.Mocked<Stripe>;
	let configService: jest.Mocked<ConfigService>;
	let createCheckoutSessionMock: jest.Mock;

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

		createCheckoutSessionMock = jest.fn();

		stripe = {
			customers: {
				create: jest.fn(),
			},
			checkout: {
				sessions: {
					create: createCheckoutSessionMock,
				},
			},
		} as unknown as jest.Mocked<Stripe>;

		configService = {
			getOrThrow: jest.fn().mockReturnValue('https://app.knowee.com'),
		} as unknown as jest.Mocked<ConfigService>;

		useCase = new CreateCheckoutSessionUseCase(
			usageRepository,
			stripe,
			configService
		);

		usageRepository.getLatestSubscriberForUser.mockResolvedValue({
			id: 'subscriber-id',
			status: 'free',
			subscriptionTierId: 1,
			stripeCustomerId: 'cus_123',
			stripeSubscriptionId: null,
		});

		usageRepository.getSubscriptionTierByName.mockResolvedValue({
			id: 2,
			name: 'premium',
			monthlyTokenLimit: 100000,
			price: '29.00',
			stripePriceId: 'price_monthly_123',
			stripePriceIdAnnual: 'price_annual_123',
		});

		createCheckoutSessionMock.mockResolvedValue({
			url: 'https://checkout.stripe.com/session',
		});
	});

	it('usa price mensal quando billingCycle = monthly', async () => {
		await useCase.execute({
			userId: 'user-id',
			email: 'user@example.com',
			planName: 'premium',
			billingCycle: 'monthly',
		});

		expect(createCheckoutSessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				line_items: [
					{
						quantity: 1,
						price: 'price_monthly_123',
					},
				],
			})
		);
	});

	it('usa price anual quando billingCycle = annual', async () => {
		await useCase.execute({
			userId: 'user-id',
			email: 'user@example.com',
			planName: 'premium',
			billingCycle: 'annual',
		});

		expect(createCheckoutSessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				line_items: [
					{
						quantity: 1,
						price: 'price_annual_123',
					},
				],
			})
		);
	});

	it('retorna erro quando plano anual nao tem price id anual', async () => {
		usageRepository.getSubscriptionTierByName.mockResolvedValue({
			id: 2,
			name: 'premium',
			monthlyTokenLimit: 100000,
			price: '29.00',
			stripePriceId: 'price_monthly_123',
			stripePriceIdAnnual: null,
		});

		await expect(
			useCase.execute({
				userId: 'user-id',
				email: 'user@example.com',
				planName: 'premium',
				billingCycle: 'annual',
			})
		).rejects.toThrow(BadRequestException);
	});

	it('retorna erro quando plano nao existe', async () => {
		usageRepository.getSubscriptionTierByName.mockResolvedValue(null);

		await expect(
			useCase.execute({
				userId: 'user-id',
				email: 'user@example.com',
				planName: 'unknown',
				billingCycle: 'monthly',
			})
		).rejects.toThrow(NotFoundException);
	});
});
