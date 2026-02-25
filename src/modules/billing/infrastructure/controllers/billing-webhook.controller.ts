import {
	BadRequestException,
	Controller,
	Headers,
	Post,
	Req,
	type RawBodyRequest,
} from '@nestjs/common';
import { type Request } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from 'src/shared/stripe/stripe.constants';
import { Inject } from '@nestjs/common';
import { HandleStripeWebhookUseCase } from '../../application/use-cases/handle-stripe-webhook.usecase';

@Controller('billing/webhook')
export class BillingWebhookController {
	constructor(
		@Inject(STRIPE_CLIENT)
		private readonly stripe: Stripe,
		private readonly configService: ConfigService,
		private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase
	) {}

	@Post('stripe')
	async handleStripeWebhook(
		@Req() req: RawBodyRequest<Request>,
		@Headers('stripe-signature') signature?: string
	): Promise<{ received: boolean }> {
		if (!signature) {
			throw new BadRequestException('Missing Stripe signature.');
		}

		const secret = this.configService.getOrThrow<string>(
			'STRIPE_WEBHOOK_SECRET'
		);

		let event: Stripe.Event;
		try {
			const payload = req.rawBody;
			if (!payload) {
				throw new BadRequestException('Missing raw request body.');
			}
			event = this.stripe.webhooks.constructEvent(payload, signature, secret);
		} catch {
			throw new BadRequestException('Invalid Stripe signature.');
		}

		await this.handleStripeWebhookUseCase.execute(event);
		return { received: true };
	}
}
