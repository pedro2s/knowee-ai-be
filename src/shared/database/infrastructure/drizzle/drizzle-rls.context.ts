import { Injectable } from '@nestjs/common';
import { AuthContext, DbContext } from '../../domain/ports/db-context.port';
import { DrizzleService } from './drizzle.service';
import { sql } from 'drizzle-orm';

@Injectable()
export class DrizzleRlsContext implements DbContext {
	constructor(private readonly drizzle: DrizzleService) {}

	private normalizeUserId(auth: AuthContext): string {
		if (typeof auth.userId !== 'string' || auth.userId.trim().length === 0) {
			throw new Error('Invalid AuthContext: userId is required for runAsUser');
		}

		return auth.userId.trim();
	}

	async runAsUser<T>(
		auth: AuthContext,
		fn: (db: unknown) => Promise<T>
	): Promise<T> {
		const userId = this.normalizeUserId(auth);

		return this.drizzle.db.transaction(async (tx) => {
			await tx.execute(
				sql`select set_config('request.jwt.claim.sub', ${userId}, true), set_config('request.jwt.claim.role', ${auth.role}, true)`
			);
			return fn(tx);
		});
	}

	runAsService<T>(fn: (db: unknown) => Promise<T>): Promise<T> {
		return this.drizzle.db.transaction(async (tx) => {
			await tx.execute(
				sql`select set_config('request.jwt.claim.role', 'service_role', true)`
			);
			return fn(tx);
		});
	}
}
