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
import { GenerationEventsService } from '../services/generation-events.service';
import {
	GENERATION_JOB_PAYLOAD_REPOSITORY,
	type GenerationJobPayloadRepositoryPort,
} from '../../domain/ports/generation-job-payload-repository.port';
import { GenerationQueueProducer } from '../../infrastructure/queue/generation-queue.producer';
import { GENERATION_QUEUE } from 'src/shared/queue/queue.constants';

@Injectable()
export class StartAssetsGenerationUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(GENERATION_JOB_REPOSITORY)
		private readonly generationJobRepository: GenerationJobRepositoryPort,
		@Inject(GENERATION_JOB_PAYLOAD_REPOSITORY)
		private readonly generationJobPayloadRepository: GenerationJobPayloadRepositoryPort,
		private readonly generationQueueProducer: GenerationQueueProducer,
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
				jobType: 'assets_generation',
				phase: 'assets_prepare',
				progress: 0,
				queueName: GENERATION_QUEUE,
				maxAttempts: 3,
				metadata: {
					jobType: 'assets_generation',
					strategy: input.data.strategy,
					providerSelection: input.data.providerSelection,
					selectedLessonIds,
				},
			},
			auth
		);

		await this.generationJobPayloadRepository.save(
			{
				jobId: job.id,
				userId: input.userId,
				payload: {
					type: 'assets_generation',
					data: {
						courseId: input.data.courseId,
						strategy: input.data.strategy,
						lessonIds: selectedLessonIds,
						providerSelection: input.data.providerSelection,
					},
				},
			},
			auth
		);

		const queueJobId =
			await this.generationQueueProducer.enqueueAssetsGeneration({
				jobId: job.id,
				userId: input.userId,
			});
		await this.generationJobRepository.update(
			job.id,
			{
				queueJobId,
				queueName: GENERATION_QUEUE,
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
