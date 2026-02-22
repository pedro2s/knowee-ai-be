import { Module } from '@nestjs/common';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { GetUsageUseCase } from './application/use-cases/get-usage.usecase';
import { GetSubscriptionUseCase } from './application/use-cases/get-subscription.usecase';
import { USAGE_REPOSITORY } from './domain/ports/usage-repository.port';
import { DrizzleUsageRepository } from './infrastructure/persistence/drizzle/drizzle-usage.repository';
import { DatabaseModule } from 'src/shared/database/database.module';
import { CreateFreeSubscriptionUseCase } from './application/use-cases/create-free-subscription.usecase';

@Module({
	imports: [DatabaseModule],
	controllers: [BillingController],
	providers: [
		GetUsageUseCase,
		GetSubscriptionUseCase,
		CreateFreeSubscriptionUseCase,
		{
			provide: USAGE_REPOSITORY,
			useClass: DrizzleUsageRepository,
		},
	],
	exports: [GetUsageUseCase, GetSubscriptionUseCase],
})
export class BillingModule {}
