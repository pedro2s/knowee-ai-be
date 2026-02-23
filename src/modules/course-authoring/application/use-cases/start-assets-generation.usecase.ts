import {
	BadRequestException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { StartAssetsGenerationDto } from '../dtos/start-assets-generation.dto';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import {
	GENERATION_JOB_REPOSITORY,
	type GenerationJobRepositoryPort,
} from '../../domain/ports/generation-job-repository.port';
import { StartAssetsGenerationResponseDto } from '../dtos/start-assets-generation.response.dto';
import { AssetsGenerationOrchestratorUseCase } from './assets-generation-orchestrator.usecase';
import { GenerationEventsService } from '../services/generation-events.service';

@Injectable()
export class StartAssetsGenerationUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		private readonly assetsOrchestratorUseCase: AssetsGenerationOrchestratorUseCase,
		private readonly generationEventsService: GenerationEventsService
	) {}

	async execute(input: {
		userId: string;
		data: StartAssetsGenerationDto;
	}): Promise<StartAssetsGenerationResponseDto> {
		const auth = { userId: input.userId, role: 'authenticated' as const };
		const course = await this.courseRepository.findById(
			input.data.courseId,
			auth
		);

		if (!course) {
			throw new NotFoundException('Curso não encontrado');
		}

		if (input.data.strategy === 'on-demand') {
			return {
				started: false,
				message: 'Modo sob demanda configurado com sucesso.',
				courseId: input.data.courseId,
			};
		}

		const allLessons = (course.modules ?? []).flatMap(
			(module) => module.lessons ?? []
		);
		let selectedLessonIds: string[] = [];

		if (input.data.strategy === 'all') {
			selectedLessonIds = allLessons.map((lesson) => lesson.id);
		} else {
			if (!input.data.lessonIds?.length) {
				throw new BadRequestException(
					'lessonIds é obrigatório para strategy=selected'
				);
			}

			const existingIds = new Set(allLessons.map((lesson) => lesson.id));
			const invalidIds = input.data.lessonIds.filter(
				(id) => !existingIds.has(id)
			);
			if (invalidIds.length > 0) {
				throw new BadRequestException(
					`lessonIds inválidos para este curso: ${invalidIds.join(', ')}`
				);
			}
			selectedLessonIds = input.data.lessonIds;
		}

		if (selectedLessonIds.length === 0) {
			throw new BadRequestException('Nenhuma aula elegível para geração');
		}

		const job = await this.generationJobRepository.create(
			{
				userId: input.userId,
				courseId: input.data.courseId,
				status: 'pending',
				phase: 'assets_prepare',
				progress: 0,
				metadata: {
					jobType: 'assets_generation',
					strategy: input.data.strategy,
					providerSelection: input.data.providerSelection,
					selectedLessonIds,
				},
			},
			auth
		);

		this.generationEventsService.publish(job.id, 'generation.snapshot', {
			jobId: job.id,
			status: job.status,
			phase: job.phase,
			progress: job.progress,
			courseId: input.data.courseId,
			metadata: job.metadata,
			error: job.error,
		});

		void this.assetsOrchestratorUseCase.run({
			jobId: job.id,
			userId: input.userId,
			courseId: input.data.courseId,
			lessonIds: selectedLessonIds,
			strategy: input.data.strategy,
			providerSelection: input.data.providerSelection,
		});

		return {
			started: true,
			message: 'Geração de assets iniciada.',
			jobId: job.id,
			courseId: input.data.courseId,
			status: 'pending',
			phase: job.phase as 'assets_prepare',
			progress: job.progress,
		};
	}
}
