import { Module } from '@nestjs/common';
import { DrizzleService } from './drizzle/drizzle.service';
import { DrizzleRlsContext } from './drizzle/drizzle-rls.context';
import { DB_CONTEXT } from '../../application/ports/db-context.port';

@Module({
	providers: [
		DrizzleService,
		{ provide: DB_CONTEXT, useClass: DrizzleRlsContext },
	],
	exports: [DrizzleService, DB_CONTEXT],
})
export class DatabaseModule {}
