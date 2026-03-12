import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { BillingWebhookController } from './billing-webhook.controller';
import type { HandleStripeWebhookUseCase } from '../../application/use-cases/handle-stripe-webhook.usecase';

describe('BillingWebhookController', () => {
	function build() {
		const stripe = {
			webhooks: {
				constructEvent: jest.fn(),
			},
		} as unknown as jest.Mocked<Stripe>;
		const configService = {
			getOrThrow: jest.fn().mockReturnValue('whsec_123'),
		} as unknown as jest.Mocked<ConfigService>;
		const handleStripeWebhookUseCase = {
			execute: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<HandleStripeWebhookUseCase>;

		return {
			stripe,
			configService,
			handleStripeWebhookUseCase,
			controller: new BillingWebhookController(
				stripe,
				configService,
				handleStripeWebhookUseCase
			),
		};
	}

	it('deve falhar sem assinatura da Stripe', async () => {
		const { controller } = build();

		await expect(
			controller.handleStripeWebhook({ rawBody: Buffer.from('body') } as never)
		).rejects.toThrow(BadRequestException);
	});

	it('deve falhar sem rawBody', async () => {
		const { controller } = build();

		await expect(
			controller.handleStripeWebhook({} as never, 'sig_123')
		).rejects.toThrow(BadRequestException);
	});

	it('deve construir o evento e delegar ao use case', async () => {
		const { controller, stripe, handleStripeWebhookUseCase } = build();
		const event = { id: 'evt_1', type: 'invoice.paid' } as never;
		stripe.webhooks.constructEvent.mockReturnValue(event);

		await expect(
			controller.handleStripeWebhook(
				{ rawBody: Buffer.from('body') } as never,
				'sig_123'
			)
		).resolves.toEqual({ received: true });
		expect(handleStripeWebhookUseCase.execute).toHaveBeenCalledWith(event);
	});

	it('deve falhar quando a assinatura for invalida', async () => {
		const { controller, stripe } = build();
		stripe.webhooks.constructEvent.mockImplementation(() => {
			throw new Error('invalid');
		});

		await expect(
			controller.handleStripeWebhook(
				{ rawBody: Buffer.from('body') } as never,
				'sig_123'
			)
		).rejects.toThrow(BadRequestException);
	});
});
