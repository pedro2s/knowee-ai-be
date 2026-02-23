import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { GenerationJob } from '../../domain/entities/generation-job.types';

@Injectable()
export class GetGenerationJobUseCase {
	constructor(
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort
	) {}

	async execute(jobId: string, userId: string): Promise<GenerationJob> {
		const auth = { userId, role: 'authenticated' as const };
		const job = await this.generationJobRepository.findById(jobId, auth);
		if (!job) {
			throw new NotFoundException('Job de geração não encontrado');
		}

		return job;
	}
}
