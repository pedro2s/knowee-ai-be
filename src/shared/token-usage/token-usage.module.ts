import { Module } from '@nestjs/common';
import { TokenUsageService } from './infrastructure/token-usage.service';
import { DatabaseModule } from '../database/database.module';
import { TokenUsagePort } from './domain/ports/token-usage.port';
import { ProviderPreferencesModule } from 'src/modules/provider-preferences/provider-preferences.module';
import { AIUsagePricingService } from './infrastructure/ai-usage-pricing.service';
import { AICreditService } from './infrastructure/ai-credit.service';

@Module({
	imports: [DatabaseModule, ProviderPreferencesModule],
	providers: [
		AICreditService,
		AIUsagePricingService,
		{
			provide: TokenUsagePort,
			useClass: TokenUsageService,
		},
	],
	exports: [AICreditService, TokenUsagePort],
})
export class TokenUsageModule {}
