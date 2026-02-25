import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { ACCESS_CONTROL_REPOSITORY } from './domain/ports/access-control.repository.port';
import { DrizzleAccessControlRepository } from './infrastructure/persistence/drizzle/drizzle-access-control.repository';
import { GetUserEntitlementsUseCase } from './application/use-cases/get-user-entitlements.usecase';
import { CheckAccessUseCase } from './application/use-cases/check-access.usecase';
import { AccessPolicyService } from './application/services/access-policy.service';
import { ProductAccessGuard } from './infrastructure/guards/product-access.guard';
import { AccessControlController } from './infrastructure/controllers/access-control.controller';
import { MarkFreemiumSampleConsumedUseCase } from './application/use-cases/mark-freemium-sample-consumed.usecase';

@Module({
	imports: [DatabaseModule],
	controllers: [AccessControlController],
	providers: [
		{
			provide: ACCESS_CONTROL_REPOSITORY,
			useClass: DrizzleAccessControlRepository,
		},
		GetUserEntitlementsUseCase,
		CheckAccessUseCase,
		AccessPolicyService,
		ProductAccessGuard,
		MarkFreemiumSampleConsumedUseCase,
	],
	exports: [
		GetUserEntitlementsUseCase,
		CheckAccessUseCase,
		ProductAccessGuard,
		MarkFreemiumSampleConsumedUseCase,
	],
})
export class AccessControlModule {}
