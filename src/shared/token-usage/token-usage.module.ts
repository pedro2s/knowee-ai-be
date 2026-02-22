import { Module } from '@nestjs/common';
import { TokenUsageService } from './infrastructure/token-usage.service';
import { DatabaseModule } from '../database/database.module';
import { TOKEN_USAGE_SERVICE } from './domain/ports/token-usage.port';

@Module({
	imports: [DatabaseModule],
	providers: [
		{
			provide: TOKEN_USAGE_SERVICE,
			useClass: TokenUsageService,
		},
	],
	exports: [TOKEN_USAGE_SERVICE],
})
export class TokenUsageModule {}
