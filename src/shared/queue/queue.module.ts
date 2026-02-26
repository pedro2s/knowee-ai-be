import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { GENERATION_QUEUE } from './queue.constants';

type RedisConnection = {
	host: string;
	port: number;
	username?: string;
	password?: string;
	db?: number;
	tls?: Record<string, unknown>;
	maxRetriesPerRequest: null;
};

function buildRedisConnection(redisUrl?: string): RedisConnection {
	if (!redisUrl) {
		return {
			host: '127.0.0.1',
			port: 6379,
			maxRetriesPerRequest: null,
		};
	}

	const parsed = new URL(redisUrl);
	const dbValue = parsed.pathname.replace('/', '');

	return {
		host: parsed.hostname,
		port: Number(parsed.port || 6379),
		username: parsed.username || undefined,
		password: parsed.password || undefined,
		db: dbValue ? Number(dbValue) : 0,
		tls: parsed.protocol === 'rediss:' ? {} : undefined,
		maxRetriesPerRequest: null,
	};
}

@Global()
@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: buildRedisConnection(
					configService.get<string>('REDIS_URL')
				),
				prefix: configService.get<string>('QUEUE_PREFIX') ?? 'knowee',
			}),
		}),
		BullModule.registerQueue({
			name: GENERATION_QUEUE,
		}),
	],
	exports: [BullModule],
})
export class QueueModule {}
