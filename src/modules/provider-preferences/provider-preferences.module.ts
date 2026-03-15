import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/shared/database/database.module';
import { ProviderPreferencesController } from './infrastructure/controllers/provider-preferences.controller';
import { GetProviderCatalogUseCase } from './application/use-cases/get-provider-catalog.usecase';
import { GetProviderPreferencesUseCase } from './application/use-cases/get-provider-preferences.usecase';
import { UpdateProviderPreferencesUseCase } from './application/use-cases/update-provider-preferences.usecase';
import { ProviderCatalogService } from './application/services/provider-catalog.service';
import { DrizzleProviderPreferencesRepository } from './infrastructure/persistence/drizzle/drizzle-provider-preferences.repository';
import { LegalModule } from '../legal/legal.module';

@Module({
	imports: [DatabaseModule, LegalModule],
	controllers: [ProviderPreferencesController],
	providers: [
		ProviderCatalogService,
		DrizzleProviderPreferencesRepository,
		GetProviderCatalogUseCase,
		GetProviderPreferencesUseCase,
		UpdateProviderPreferencesUseCase,
	],
	exports: [
		UpdateProviderPreferencesUseCase,
		GetProviderPreferencesUseCase,
		ProviderCatalogService,
	],
})
export class ProviderPreferencesModule {}
