import { Module } from '@nestjs/common';
import { BillingController } from './infrastructure/controllers/billing.controller';
import { GetUsageUseCase } from './application/use-cases/get-usage.usecase';
import { USAGE_REPOSITORY } from './domain/ports/usage-repository.port';
import { DrizzleUsageRepository } from './infrastructure/persistence/drizzle/drizzle-usage.repository';
import { DatabaseModule } from 'src/shared/infrastructure/database/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [BillingController],
	providers: [
		GetUsageUseCase,
		{
			provide: USAGE_REPOSITORY,
			useClass: DrizzleUsageRepository,
		},
	],
	exports: [GetUsageUseCase],
})
export class BillingModule {}
