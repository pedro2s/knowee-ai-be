import { Inject, Injectable } from '@nestjs/common';
import { GenerateCourseDto } from '../dtos/generate-course.dto';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { CourseGenerationOrchestratorUseCase } from './course-generation-orchestrator.usecase';
import { GenerationEventsService } from '../services/generation-events.service';
import { GenerationJob } from '../../domain/entities/generation-job.types';

@Injectable()
export class StartCourseGenerationUseCase {
	constructor(
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly orchestrator: CourseGenerationOrchestratorUseCase,
		private readonly generationEventsService: GenerationEventsService
	) {}

	async execute(input: {
		userId: string;
		data: GenerateCourseDto;
		files: Express.Multer.File[];
	}): Promise<GenerationJob> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const job = await this.generationJobRepository.create(
			{
				userId: input.userId,
				status: 'pending',
				phase: 'structure',
				progress: 0,
			},
			auth
		);

		this.generationEventsService.publish(job.id, 'generation.snapshot', {
			jobId: job.id,
			status: job.status,
			phase: job.phase,
			progress: job.progress,
			courseId: job.courseId,
			metadata: job.metadata,
			error: job.error,
		});

		void this.orchestrator.run({
			jobId: job.id,
			userId: input.userId,
			data: input.data,
			files: input.files,
		});

		return job;
	}
}
