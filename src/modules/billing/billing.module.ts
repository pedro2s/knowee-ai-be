import { Module } from '@nestjs/common';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { BillingWebhookController } from './infrastructure/controllers/billing-webhook.controller';
import { BillingPublicController } from './infrastructure/controllers/billing-public.controller';
import { GetUsageUseCase } from './application/use-cases/get-usage.usecase';
import { GetSubscriptionUseCase } from './application/use-cases/get-subscription.usecase';
import { USAGE_REPOSITORY } from './domain/ports/usage-repository.port';
import { DrizzleUsageRepository } from './infrastructure/persistence/drizzle/drizzle-usage.repository';
import { DatabaseModule } from 'src/shared/database/database.module';
import { CreateFreeSubscriptionUseCase } from './application/use-cases/create-free-subscription.usecase';
import { AccessControlModule } from '../access-control/access-control.module';
import { CreateCheckoutSessionUseCase } from './application/use-cases/create-checkout-session.usecase';
import { StripeModule } from 'src/shared/stripe/stripe.module';
import { HandleStripeWebhookUseCase } from './application/use-cases/handle-stripe-webhook.usecase';
import { ConfigModule } from '@nestjs/config';
import { GetPublicPlansUseCase } from './application/use-cases/get-public-plans.usecase';

@Module({
	imports: [DatabaseModule, AccessControlModule, StripeModule, ConfigModule],
	controllers: [
		BillingController,
		BillingWebhookController,
		BillingPublicController,
	],
	providers: [
		GetUsageUseCase,
		GetSubscriptionUseCase,
		CreateFreeSubscriptionUseCase,
		CreateCheckoutSessionUseCase,
		HandleStripeWebhookUseCase,
		GetPublicPlansUseCase,
		{
			provide: USAGE_REPOSITORY,
			useClass: DrizzleUsageRepository,
		},
	],
	exports: [
		GetUsageUseCase,
		GetSubscriptionUseCase,
		CreateFreeSubscriptionUseCase,
		CreateCheckoutSessionUseCase,
	],
})
export class BillingModule {}
