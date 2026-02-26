import type { RedisOptions } from 'ioredis';

export type RedisConnectionSource = 'REDIS_URL' | 'fallback';

export interface RedisConnectionConfig {
	connection: RedisOptions;
	source: RedisConnectionSource;
}

export function buildRedisConnectionConfig(
	redisUrl?: string
): RedisConnectionConfig {
	if (!redisUrl) {
		return {
			source: 'fallback',
			connection: {
				host: '127.0.0.1',
				port: 6379,
				maxRetriesPerRequest: null,
			},
		};
	}

	const parsed = new URL(redisUrl);
	const dbValue = parsed.pathname.replace('/', '');
	const db = dbValue ? Number(dbValue) : 0;

	return {
		source: 'REDIS_URL',
		connection: {
			host: parsed.hostname,
			port: Number(parsed.port || 6379),
			username: parsed.username || undefined,
			password: parsed.password || undefined,
			db: Number.isNaN(db) ? 0 : db,
			tls: parsed.protocol === 'rediss:' ? {} : undefined,
			maxRetriesPerRequest: null,
		},
	};
}
