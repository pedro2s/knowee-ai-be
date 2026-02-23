import { Inject, Injectable } from '@nestjs/common';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { GenerationJob } from '../../domain/entities/generation-job.types';

@Injectable()
export class GetActiveGenerationJobByCourseUseCase {
	constructor(
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort
	) {}

	async execute(
		courseId: string,
		userId: string
	): Promise<GenerationJob | null> {
		const auth = { userId, role: 'authenticated' as const };
		return this.generationJobRepository.findActiveByCourseId(courseId, auth);
	}
}
