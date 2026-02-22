import { Pool } from 'pg';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DrizzleService {
	public db: NodePgDatabase<typeof schema>;

	constructor(private readonly configService: ConfigService) {
		const pool = new Pool({
			connectionString: this.configService.getOrThrow('DATABASE_URL'),
		});
		this.db = drizzle(pool, { schema });
	}
}
