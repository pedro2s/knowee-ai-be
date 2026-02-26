import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';

export const GENERATION_JOB_PAYLOAD_REPOSITORY =
	'GenerationJobPayloadRepository';

export interface GenerationJobPayloadRepositoryPort {
	save(
		input: {
			jobId: string;
			userId: string;
			payload: Record<string, unknown>;
		},
		auth: AuthContext
	): Promise<void>;
	findByJobId(
		jobId: string,
		auth: AuthContext
	): Promise<Record<string, unknown> | null>;
	deleteByJobId(jobId: string, auth: AuthContext): Promise<void>;
}
