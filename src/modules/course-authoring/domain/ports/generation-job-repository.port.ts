import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import {
	CreateGenerationJobInput,
	GenerationJob,
	UpdateGenerationJobInput,
} from '../entities/generation-job.types';

export abstract class GenerationJobRepositoryPort {
	abstract create(
		input: CreateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob>;
	abstract findById(
		id: string,
		auth: AuthContext
	): Promise<GenerationJob | null>;
	abstract findActiveByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<GenerationJob | null>;
	abstract findActiveJobsByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<GenerationJob[]>;
	abstract findActiveByDedupeKey(
		dedupeKey: string,
		auth: AuthContext
	): Promise<GenerationJob | null>;
	abstract update(
		id: string,
		input: UpdateGenerationJobInput,
		auth: AuthContext
	): Promise<GenerationJob | null>;
}
