import { Module } from '@nestjs/common';
import { TokenUsageService } from './infrastructure/token-usage.service';
import { DatabaseModule } from '../database/database.module';
import { TokenUsagePort } from './domain/ports/token-usage.port';

@Module({
	imports: [DatabaseModule],
	providers: [
		{
			provide: TokenUsagePort,
			useClass: TokenUsageService,
		},
	],
	exports: [TokenUsagePort],
})
export class TokenUsageModule {}
