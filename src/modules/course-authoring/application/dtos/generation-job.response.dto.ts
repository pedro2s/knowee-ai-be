import { GenerationJob } from '../../domain/entities/generation-job.types';

export class GenerationJobResponseDto {
	id: string;
	userId: string;
	courseId: string | null;
	status: string;
	jobType: string;
	phase: string;
	progress: number;
	queueJobId: string | null;
	attempts: number;
	maxAttempts: number;
	metadata: Record<string, unknown>;
	error: string | null;
	startedAt: string | null;
	heartbeatAt: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;

	static fromDomain(job: GenerationJob): GenerationJobResponseDto {
		return {
			id: job.id,
			userId: job.userId,
			courseId: job.courseId,
			status: job.status,
			jobType: job.jobType,
			phase: job.phase,
			progress: job.progress,
			queueJobId: job.queueJobId,
			attempts: job.attempts,
			maxAttempts: job.maxAttempts,
			metadata: job.metadata,
			error: job.error,
			startedAt: job.startedAt ? job.startedAt.toISOString() : null,
			heartbeatAt: job.heartbeatAt ? job.heartbeatAt.toISOString() : null,
			createdAt: job.createdAt.toISOString(),
			updatedAt: job.updatedAt.toISOString(),
			completedAt: job.completedAt ? job.completedAt.toISOString() : null,
		};
	}
}
