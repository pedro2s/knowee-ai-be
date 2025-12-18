import { Global, Module } from '@nestjs/common';
import { DrizzleService } from './infrastructure/drizzle/drizzle.service';

@Module({
	providers: [DrizzleService],
	exports: [DrizzleService],
})
export class DatabaseModule {}
