import { Module } from '@nestjs/common';
import { DrizzleService } from './infrastructure/drizzle/drizzle.service';
import { DrizzleRlsContext } from './infrastructure/drizzle/drizzle-rls.context';
import { DB_CONTEXT } from './domain/ports/db-context.port';

@Module({
	providers: [
		DrizzleService,
		{ provide: DB_CONTEXT, useClass: DrizzleRlsContext },
	],
	exports: [DrizzleService, DB_CONTEXT],
})
export class DatabaseModule {}
