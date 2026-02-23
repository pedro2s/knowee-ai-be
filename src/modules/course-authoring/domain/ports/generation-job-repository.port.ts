import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import {
	CreateGenerationJobInput,
	GenerationJob,
	UpdateGenerationJobInput,
} from '../entities/generation-job.types';

export const GENERATION_JOB_REPOSITORY = 'GenerationJobRepository';

export interface GenerationJobRepositoryPort {
	create(
		input: CreateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob>;
	findById(id: string, auth: AuthContext): Promise<GenerationJob | null>;
	findActiveByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<GenerationJob | null>;
	update(
		id: string,
		input: UpdateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob | null>;
}
