import { Module } from '@nestjs/common';
import { TokenUsageService } from './token-usage.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [TokenUsageService],
	exports: [TokenUsageService],
})
export class TokenUsageModule {}
