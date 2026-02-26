import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
	GENERATION_JOB_NAMES,
	GENERATION_QUEUE,
	GenerationQueueJobName,
} from 'src/shared/queue/queue.constants';
import { GenerationQueueJobData } from './generation-queue.types';

@Injectable()
export class GenerationQueueProducer {
	constructor(
		@InjectQueue(GENERATION_QUEUE)
		private readonly generationQueue: Queue<GenerationQueueJobData>,
		private readonly configService: ConfigService
	) {}

	private getAttempts(): number {
		const raw = this.configService.get<string>('QUEUE_DEFAULT_ATTEMPTS');
		const parsed = Number(raw ?? 3);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
	}

	private getBackoffDelay(): number {
		const raw = this.configService.get<string>('QUEUE_BACKOFF_MS');
		const parsed = Number(raw ?? 2000);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 2000;
	}

	private async enqueue(
		name: GenerationQueueJobName,
		data: GenerationQueueJobData
	): Promise<string> {
		const queueJob = await this.generationQueue.add(name, data, {
			jobId: data.jobId,
			attempts: this.getAttempts(),
			backoff: {
				type: 'exponential',
				delay: this.getBackoffDelay(),
			},
			removeOnComplete: 1000,
			removeOnFail: false,
		});

		return queueJob.id ? String(queueJob.id) : data.jobId;
	}

	async enqueueCourseGeneration(data: GenerationQueueJobData): Promise<string> {
		return this.enqueue(GENERATION_JOB_NAMES.COURSE_GENERATE, data);
	}

	async enqueueAssetsGeneration(data: GenerationQueueJobData): Promise<string> {
		return this.enqueue(GENERATION_JOB_NAMES.ASSETS_GENERATE, data);
	}

	async enqueueLessonAudioGeneration(
		data: GenerationQueueJobData
	): Promise<string> {
		return this.enqueue(GENERATION_JOB_NAMES.LESSON_AUDIO_GENERATE, data);
	}

	async enqueueLessonSectionVideoGeneration(
		data: GenerationQueueJobData
	): Promise<string> {
		return this.enqueue(
			GENERATION_JOB_NAMES.LESSON_SECTION_VIDEO_GENERATE,
			data
		);
	}

	async enqueueLessonMergeVideoGeneration(
		data: GenerationQueueJobData
	): Promise<string> {
		return this.enqueue(GENERATION_JOB_NAMES.LESSON_MERGE_VIDEO_GENERATE, data);
	}
}
