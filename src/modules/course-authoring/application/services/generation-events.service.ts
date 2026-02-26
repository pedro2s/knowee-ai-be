import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Observable, Subject } from 'rxjs';
import {
	buildRedisConnectionConfig,
	RedisConnectionConfig,
} from '../../../../shared/queue/redis-connection.util';

export type GenerationEventType =
	| 'generation.snapshot'
	| 'generation.phase.started'
	| 'generation.phase.progress'
	| 'generation.phase.completed'
	| 'generation.assets.lesson.started'
	| 'generation.assets.lesson.progress'
	| 'generation.assets.lesson.completed'
	| 'generation.assets.lesson.failed'
	| 'generation.assets.summary'
	| 'generation.redirect-ready'
	| 'generation.demo-ready'
	| 'generation.completed'
	| 'generation.failed'
	| 'generation.heartbeat';

export interface GenerationEvent<T = Record<string, unknown>> {
	type: GenerationEventType;
	jobId: string;
	timestamp: string;
	data: T;
}

@Injectable()
export class GenerationEventsService implements OnModuleDestroy {
	private readonly logger = new Logger(GenerationEventsService.name);
	private readonly channels = new Map<string, Subject<GenerationEvent>>();
	private readonly redisChannelSubscribers = new Map<string, number>();
	private readonly redisConfig: RedisConnectionConfig;
	private publisher: Redis | null = null;
	private subscriber: Redis | null = null;

	constructor(private readonly configService: ConfigService) {
		this.redisConfig = buildRedisConnectionConfig(
			this.configService.get<string>('REDIS_URL')
		);
	}

	private getChannelName(jobId: string): string {
		return `generation-events:${jobId}`;
	}

	private initRedisClients() {
		if (this.publisher && this.subscriber) {
			return;
		}

		this.logger.log(
			this.redisConfig.source === 'REDIS_URL'
				? 'Events Redis via REDIS_URL'
				: 'Events Redis via fallback 127.0.0.1:6379'
		);

		this.publisher = new Redis({
			...this.redisConfig.connection,
		});
		this.subscriber = new Redis({
			...this.redisConfig.connection,
		});

		this.subscriber.on('message', (channel, message) => {
			try {
				const parsed = JSON.parse(message) as GenerationEvent;
				const jobId = channel.replace('generation-events:', '');
				this.getChannel(jobId).next(parsed);
			} catch (error) {
				this.logger.warn(
					`Erro ao parsear evento redis no canal ${channel}: ${
						error instanceof Error ? error.message : String(error)
					}`
				);
			}
		});

		const onRedisError = (error: unknown) => {
			this.logger.warn(
				`Redis indisponível para eventos de geração: ${
					error instanceof Error ? error.message : String(error)
				}`
			);
		};

		this.publisher.on('error', onRedisError);
		this.subscriber.on('error', onRedisError);
	}

	stream(jobId: string): Observable<GenerationEvent> {
		this.initRedisClients();
		const channel = this.getChannel(jobId);
		const redisChannelName = this.getChannelName(jobId);

		const current = this.redisChannelSubscribers.get(redisChannelName) ?? 0;
		this.redisChannelSubscribers.set(redisChannelName, current + 1);
		if (current === 0 && this.subscriber) {
			void this.subscriber.subscribe(redisChannelName);
		}

		return new Observable<GenerationEvent>((subscriber) => {
			const subscription = channel.subscribe((event) => {
				subscriber.next(event);
			});

			return () => {
				subscription.unsubscribe();
				const left =
					(this.redisChannelSubscribers.get(redisChannelName) ?? 1) - 1;
				if (left <= 0) {
					this.redisChannelSubscribers.delete(redisChannelName);
					if (this.subscriber) {
						void this.subscriber.unsubscribe(redisChannelName);
					}
				} else {
					this.redisChannelSubscribers.set(redisChannelName, left);
				}
			};
		});
	}

	publish<T extends Record<string, unknown>>(
		jobId: string,
		type: GenerationEventType,
		data: T
	) {
		const event: GenerationEvent<T> = {
			type,
			jobId,
			timestamp: new Date().toISOString(),
			data,
		};

		// Emite localmente para o próprio processo.
		this.getChannel(jobId).next(event);
		this.initRedisClients();
		if (this.publisher) {
			void this.publisher.publish(
				this.getChannelName(jobId),
				JSON.stringify(event)
			);
		}
	}

	private getChannel(jobId: string): Subject<GenerationEvent> {
		const current = this.channels.get(jobId);
		if (current) {
			return current;
		}

		const channel = new Subject<GenerationEvent>();
		this.channels.set(jobId, channel);
		return channel;
	}

	async onModuleDestroy() {
		if (this.publisher) {
			await this.publisher.quit();
		}
		if (this.subscriber) {
			await this.subscriber.quit();
		}
	}
}
