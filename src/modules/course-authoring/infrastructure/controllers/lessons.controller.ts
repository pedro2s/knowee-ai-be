import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';
import { GetLessonUseCase } from '../../application/use-cases/get-lesson.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { LessonResponseDto } from '../../application/dtos/lesson.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';

@Controller('lessons')
@UseGuards(SupabaseAuthGuard)
export class LessonsController {
	constructor(
		private readonly getLessonUseCase: GetLessonUseCase,
		private readonly generateAudio: GenerateLessonAudioUseCase
	) {} // Updated injected type and name

	@Get('/:id')
	async getLesson(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	): Promise<LessonResponseDto> {
		const lesson = await this.getLessonUseCase.execute(lessonId, user.id);
		return LessonResponseDto.fromDomain(lesson);
	}

	@Post(':id/video')
	geneateLessonVideo(
		@Param('id') lessonId: string,
		@Body() body,
		@CurrentUser() user: UserPayload
	) {
		void (async () => {
			try {
				await this.generateAudio.execute({
					lessonId,
					imageProvider: body.imageProvider,
					audioProvider: body.audioProvider,
					userId: user.id,
				});
			} catch (error) {
				console.log(error);
			}
		})();

		return {
			message: 'Geração de vídeo iniciada',
		};
	}
}
