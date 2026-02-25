import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Sse,
	UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { GetGenerationJobUseCase } from '../../application/use-cases/get-generation-job.usecase';
import { GenerationJobResponseDto } from '../../application/dtos/generation-job.response.dto';
import { GenerationEventsService } from '../../application/services/generation-events.service';
import { interval, map, merge, Observable, of } from 'rxjs';
import { StartAssetsGenerationUseCase } from '../../application/use-cases/start-assets-generation.usecase';
import { StartAssetsGenerationDto } from '../../application/dtos/start-assets-generation.dto';
import { StartAssetsGenerationResponseDto } from '../../application/dtos/start-assets-generation.response.dto';
import { GetActiveGenerationJobByCourseUseCase } from '../../application/use-cases/get-active-generation-job-by-course.usecase';
import { ProductAccessGuard } from 'src/modules/access-control/infrastructure/guards/product-access.guard';
import { RequireAccess } from 'src/modules/access-control/infrastructure/decorators/require-access.decorator';

interface SseMessage {
	type: string;
	data: Record<string, unknown>;
}

@Controller('generation')
@UseGuards(SupabaseAuthGuard, ProductAccessGuard)
export class GenerationController {
	constructor(
		private readonly getGenerationJobUseCase: GetGenerationJobUseCase,
		private readonly getActiveGenerationJobByCourseUseCase: GetActiveGenerationJobByCourseUseCase,
		private readonly generationEventsService: GenerationEventsService,
		private readonly startAssetsGenerationUseCase: StartAssetsGenerationUseCase
	) {}

	@Post('/assets/start')
	@RequireAccess('assets.generate', { courseIdBody: 'courseId' })
	async startAssets(
		@Body() body: StartAssetsGenerationDto,
		@CurrentUser() user: UserPayload
	): Promise<StartAssetsGenerationResponseDto> {
		return this.startAssetsGenerationUseCase.execute({
			userId: user.id,
			data: body,
		});
	}

	@Get('/course/:courseId/active')
	async getActiveByCourse(
		@Param('courseId') courseId: string,
		@CurrentUser() user: UserPayload
	): Promise<GenerationJobResponseDto | null> {
		const job = await this.getActiveGenerationJobByCourseUseCase.execute(
			courseId,
			user.id
		);

		return job ? GenerationJobResponseDto.fromDomain(job) : null;
	}

	@Get('/:jobId')
	async getJob(
		@Param('jobId') jobId: string,
		@CurrentUser() user: UserPayload
	): Promise<GenerationJobResponseDto> {
		const job = await this.getGenerationJobUseCase.execute(jobId, user.id);
		return GenerationJobResponseDto.fromDomain(job);
	}

	@Sse('/:jobId/stream')
	async stream(
		@Param('jobId') jobId: string,
		@CurrentUser() user: UserPayload
	): Promise<Observable<SseMessage>> {
		const job = await this.getGenerationJobUseCase.execute(jobId, user.id);
		const snapshot$ = of({
			type: 'generation.snapshot',
			data: {
				jobId: job.id,
				status: job.status,
				phase: job.phase,
				progress: job.progress,
				courseId: job.courseId,
				metadata: job.metadata,
				error: job.error,
			},
		});

		const events$ = this.generationEventsService.stream(jobId).pipe(
			map((event) => ({
				type: event.type,
				data: event.data,
			}))
		);

		const heartbeat$ = interval(15000).pipe(
			map(() => ({
				type: 'generation.heartbeat',
				data: {
					jobId,
					timestamp: new Date().toISOString(),
				},
			}))
		);

		return merge(snapshot$, events$, heartbeat$);
	}
}
