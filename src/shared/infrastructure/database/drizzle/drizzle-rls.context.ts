import { Injectable } from '@nestjs/common';
import {
	AuthContext,
	DbContext,
} from '../../../application/ports/db-context.port';
import { DrizzleService } from './drizzle.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class DrizzleRlsContext implements DbContext {
	constructor(private readonly drizzle: DrizzleService) {}

	async runAsUser<T>(
		auth: AuthContext,
		fn: (db: unknown) => Promise<T>,
	): Promise<T> {
		return this.drizzle.db.transaction(async (tx) => {
			await tx.execute(
				sql`select set_config('request.jwt.claim.sub', ${auth.userId}, true), set_config('request.jwt.claim.role', ${auth.role}, true)`,
			);
			return fn(tx);
		});
	}

	runAsService<T>(fn: (db: unknown) => Promise<T>): Promise<T> {
		return this.drizzle.db.transaction(async (tx) => {
			await tx.execute(
				sql`select set_config('request.jwt.claim.role', 'service_role', true)`,
			);
			return fn(tx);
		});
	}
}
