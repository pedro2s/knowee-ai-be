import { Controller, Get, Param, Sse, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { GetGenerationJobUseCase } from '../../application/use-cases/get-generation-job.usecase';
import { GenerationJobResponseDto } from '../../application/dtos/generation-job.response.dto';
import { GenerationEventsService } from '../../application/services/generation-events.service';
import { interval, map, merge, Observable, of } from 'rxjs';

interface SseMessage {
	type: string;
	data: Record<string, unknown>;
}

@Controller('generation')
@UseGuards(SupabaseAuthGuard)
export class GenerationController {
	constructor(
		private readonly getGenerationJobUseCase: GetGenerationJobUseCase,
		private readonly generationEventsService: GenerationEventsService
	) {}

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
