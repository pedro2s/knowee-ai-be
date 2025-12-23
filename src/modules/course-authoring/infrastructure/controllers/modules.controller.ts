import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FetchLessonsUseCase } from '../../application/use-cases/fetchLessons.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/types/user.types';
import { LessonResponseDto } from '../../application/dtos/lesson.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';

@Controller('modules')
@UseGuards(SupabaseAuthGuard)
export class ModulesController {
	constructor(private readonly fetchLessons: FetchLessonsUseCase) {}

	@Get('/:moduleId/lessons')
	async findLessons(
		@Param('moduleId') moduleId: string,
		@CurrentUser() user: UserPayload,
	): Promise<LessonResponseDto[]> {
		const lessons = await this.fetchLessons.execute(moduleId, user.id);
		return lessons.map(LessonResponseDto.fromDomain);
	}
}
