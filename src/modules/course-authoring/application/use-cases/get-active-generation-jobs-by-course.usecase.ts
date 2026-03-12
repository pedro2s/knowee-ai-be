import { Injectable } from '@nestjs/common';
import { GenerationJobRepositoryPort } from '../../domain/ports/generation-job-repository.port';
import { GenerationJob } from '../../domain/entities/generation-job.types';

@Injectable()
export class GetActiveGenerationJobsByCourseUseCase {
	constructor(
		private readonly generationJobRepository: GenerationJobRepositoryPort
	) {}

	async execute(courseId: string, userId: string): Promise<GenerationJob[]> {
		const auth = { userId, role: 'authenticated' as const };
		return this.generationJobRepository.findActiveJobsByCourseId(
			courseId,
			auth
		);
	}
}
