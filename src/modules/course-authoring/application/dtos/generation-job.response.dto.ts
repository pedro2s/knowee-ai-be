import { GenerationJob } from '../../domain/entities/generation-job.types';

export class GenerationJobResponseDto {
	id: string;
	userId: string;
	courseId: string | null;
	status: string;
	phase: string;
	progress: number;
	metadata: Record<string, unknown>;
	error: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;

	static fromDomain(job: GenerationJob): GenerationJobResponseDto {
		return {
			id: job.id,
			userId: job.userId,
			courseId: job.courseId,
			status: job.status,
			phase: job.phase,
			progress: job.progress,
			metadata: job.metadata,
			error: job.error,
			createdAt: job.createdAt.toISOString(),
			updatedAt: job.updatedAt.toISOString(),
			completedAt: job.completedAt ? job.completedAt.toISOString() : null,
		};
	}
}
