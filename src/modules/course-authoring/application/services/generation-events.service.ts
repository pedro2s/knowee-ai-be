import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

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
export class GenerationEventsService {
	private readonly channels = new Map<string, Subject<GenerationEvent>>();

	stream(jobId: string): Observable<GenerationEvent> {
		return this.getChannel(jobId).asObservable();
	}

	publish<T extends Record<string, unknown>>(
		jobId: string,
		type: GenerationEventType,
		data: T
	) {
		this.getChannel(jobId).next({
			type,
			jobId,
			timestamp: new Date().toISOString(),
			data,
		});
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
}
