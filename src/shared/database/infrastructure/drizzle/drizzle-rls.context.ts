import { Injectable } from '@nestjs/common';
import {
	AuthContext,
	DbContext,
} from '../../application/ports/db-context.port';
import { DrizzleService } from './drizzle.service';
import { drizzle } from 'drizzle-orm/node-postgres';

@Injectable()
export class DrizzleRlsContext implements DbContext {
	constructor(private readonly drizzle: DrizzleService) {}

	async runAsUser<T>(
		auth: AuthContext,
		fn: (db: unknown) => Promise<T>,
	): Promise<T> {
		return this.drizzle.db.transaction(async (tx) => {
			// await tx.query.

			return fn(drizzle(tx));
		});
	}

	runAsService<T>(fn: (db: unknown) => Promise<T>): Promise<T> {
		throw new Error('Method not implemented.');
	}
}
