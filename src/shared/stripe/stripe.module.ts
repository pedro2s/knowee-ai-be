import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './stripe.constants';

@Module({
	providers: [
		{
			provide: STRIPE_CLIENT,
			useFactory: (configService: ConfigService) =>
				new Stripe(configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
					apiVersion: '2026-01-28.clover',
				}),
			inject: [ConfigService],
		},
	],
	exports: [STRIPE_CLIENT],
})
export class StripeModule {}
