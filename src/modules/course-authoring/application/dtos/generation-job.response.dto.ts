import { GenerationJob } from '../../domain/entities/generation-job.types';
import { GenerationJobScopeResponseDto } from './generation-job-scope.response.dto';

export class GenerationJobResponseDto {
	id: string;
	userId: string;
	courseId: string | null;
	status: string;
	jobType: string;
	jobFamily: string;
	jobIntent: string;
	phase: string;
	progress: number;
	dedupeKey: string | null;
	targetLabel: string | null;
	scope: GenerationJobScopeResponseDto;
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
			jobFamily: job.jobFamily,
			jobIntent: job.jobIntent,
			phase: job.phase,
			progress: job.progress,
			dedupeKey: job.dedupeKey,
			targetLabel: job.targetLabel,
			scope: job.scope,
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
