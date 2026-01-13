import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	UseGuards,
} from '@nestjs/common';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';
import { GetLessonUseCase } from '../../application/use-cases/get-lesson.usecase';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { LessonResponseDto } from '../../application/dtos/lesson.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { UpdateLessonDto } from '../../application/dtos/update-lesson.dto';
import { UpdateLessonUseCase } from '../../application/use-cases/update-lesson.usecase';
import { GenerateArticleUseCase } from '../../application/use-cases/generate-article.usecase';
import { GenerateArticleDto } from '../../application/dtos/generate-article.dto';
import { GeneratedArticleResponseDto } from '../../application/dtos/generated-article.response.dto';

@Controller('lessons')
@UseGuards(SupabaseAuthGuard)
export class LessonsController {
	constructor(
		private readonly getLessonUseCase: GetLessonUseCase,
		private readonly generateAudio: GenerateLessonAudioUseCase,
		private readonly updateLessonUseCase: UpdateLessonUseCase,
		private readonly generateArticleUseCase: GenerateArticleUseCase
	) {} // Updated injected type and name

	// 1. Rotas Específicas (SEM ID) - Devem vir PRIMEIRO

	@Post('/generate-article')
	async generateArticle(
		@Body() data: GenerateArticleDto,
		@CurrentUser() user: UserPayload
	): Promise<GeneratedArticleResponseDto> {
		const generatedArticle = await this.generateArticleUseCase.execute(
			data,
			user.id
		);
		return GeneratedArticleResponseDto.fromDomain(generatedArticle);
	}

	// 2. Rotas Específicas (COM ID)

	@Post('/:id/video')
	generateLessonVideo(
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

	// 3. Rotas Genéricas (CRUD) - Devem vir POR ÚLTIMO

	@Get('/:id')
	async getLesson(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	): Promise<LessonResponseDto> {
		const lesson = await this.getLessonUseCase.execute(lessonId, user.id);
		return LessonResponseDto.fromDomain(lesson);
	}

	@Put('/:id')
	async updateLesson(
		@Param('id') lessonId: string,
		@Body() data: UpdateLessonDto,
		@CurrentUser() user: UserPayload
	): Promise<LessonResponseDto> {
		const updatedLesson = await this.updateLessonUseCase.execute(
			lessonId,
			data,
			user.id
		);
		return LessonResponseDto.fromDomain(updatedLesson);
	}
}
