import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';

export abstract class GenerationJobPayloadRepositoryPort {
	abstract save(
		input: {
			jobId: string;
			userId: string;
			payload: Record<string, unknown>;
		},
		auth: AuthContext
	): Promise<void>;
	abstract findByJobId(
		jobId: string,
		auth: AuthContext
	): Promise<Record<string, unknown> | null>;
	abstract deleteByJobId(jobId: string, auth: AuthContext): Promise<void>;
}
