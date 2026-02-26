import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { GENERATION_QUEUE } from './queue.constants';
import { buildRedisConnectionConfig } from './redis-connection.util';

@Global()
@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: buildRedisConnectionConfig(
					configService.get<string>('REDIS_URL')
				).connection,
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
