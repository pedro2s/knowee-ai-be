import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';
import { GetLessonUseCase } from '../../application/use-cases/get-lesson.usecase';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { LessonResponseDto } from '../../application/dtos/lesson.response.dto';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { UpdateLessonDto } from '../../application/dtos/update-lesson.dto';
import { UpdateLessonUseCase } from '../../application/use-cases/update-lesson.usecase';
import { GenerateArticleUseCase } from '../../application/use-cases/generate-article.usecase';
import { GenerateArticleDto } from '../../application/dtos/generate-article.dto';
import { GeneratedArticleResponseDto } from '../../application/dtos/generated-article.response.dto';
import { GenerateLessonScriptDto } from '../../application/dtos/generate-lesson-script.dto';
import { GeneratedLessonScriptResponseDto } from '../../application/dtos/generated-lesson-script.response.dto';
import { GenerateLessonScriptUseCase } from '../../application/use-cases/generate-lesson-script.usecase';
import { GenerateLessonAudioDto } from '../../application/dtos/generate-lesson-audio.dto';
import { GenerateSectionVideoDto } from '../../application/dtos/generate-section-video.dto';
import { GenerateSectionVideoUseCase } from '../../application/use-cases/generate-section-video.usecase';
import { GeneratedSectionVideoResponseDto } from '../../application/dtos/generated-section-video.response.dto';
import { MergeLessonSectionsVideoUseCase } from '../../application/use-cases/merge-lesson-sections-video.usecase';
import { ReorderLessonsDto } from '../../application/dtos/reorder-lessons.dto';
import { ReorderLessonsUseCase } from '../../application/use-cases/reorder-lessons.usecase';
import { FileInterceptor } from '@nestjs/platform-express';
import { ManageLessonAssetsUseCase } from '../../application/use-cases/manage-lesson-assets.usecase';
import { GenerateQuizDto } from '../../application/dtos/generate-quiz.dto';
import { GeneratedQuizResponseDto } from '../../application/dtos/generated-quiz.response.dto';
import { GenerateQuizUseCase } from '../../application/use-cases/generate-quiz.usecase';
import { ProductAccessGuard } from 'src/modules/access-control/infrastructure/guards/product-access.guard';
import { RequireAccess } from 'src/modules/access-control/infrastructure/decorators/require-access.decorator';

@Controller('lessons')
@UseGuards(SupabaseAuthGuard, ProductAccessGuard)
export class LessonsController {
	constructor(
		private readonly getLessonUseCase: GetLessonUseCase,
		private readonly generateAudio: GenerateLessonAudioUseCase,
		private readonly updateLessonUseCase: UpdateLessonUseCase,
		private readonly generateArticleUseCase: GenerateArticleUseCase,
		private readonly generateLessonScriptUseCase: GenerateLessonScriptUseCase,
		private readonly generateSectionVideoUseCase: GenerateSectionVideoUseCase,
		private readonly mergeLessonSectionsVideoUseCase: MergeLessonSectionsVideoUseCase,
		private readonly reorderLessonsUseCase: ReorderLessonsUseCase,
		private readonly manageLessonAssetsUseCase: ManageLessonAssetsUseCase,
		private readonly generateQuizUseCase: GenerateQuizUseCase
	) {}

	// 1. Rotas Específicas (SEM ID) - Devem vir PRIMEIRO

	@Post('/generate-article')
	@RequireAccess('ai.interaction', { courseIdBody: 'courseId' })
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

	@Post('/generate-script')
	@RequireAccess('ai.interaction', { courseIdBody: 'courseId' })
	async generateScriptContent(
		@Body() body: GenerateLessonScriptDto,
		@CurrentUser() user: UserPayload
	): Promise<GeneratedLessonScriptResponseDto> {
		const generatedScript = await this.generateLessonScriptUseCase.execute(
			body,
			user.id
		);
		return GeneratedLessonScriptResponseDto.fromDomain(generatedScript);
	}

	@Post('generate-video')
	@RequireAccess('ai.interaction', { courseIdBody: 'courseId' })
	async generateVideo(
		@Body() body: GenerateSectionVideoDto,
		@CurrentUser() user: UserPayload
	): Promise<GeneratedSectionVideoResponseDto> {
		const generatedVideoSection =
			await this.generateSectionVideoUseCase.execute(body, user.id);

		return GeneratedSectionVideoResponseDto.fromDomain(generatedVideoSection);
	}

	@Post('/reorder')
	@RequireAccess('lesson.reorder', { courseIdBody: 'courseId' })
	async reorderLessons(
		@Body() dto: ReorderLessonsDto,
		@CurrentUser() user: UserPayload
	): Promise<{ message: string }> {
		await this.reorderLessonsUseCase.execute({
			dto,
			userId: user.id,
		});

		return {
			message: 'Ordem das aulas atualizada com sucesso',
		};
	}

	@Post('/generate-quiz')
	@RequireAccess('ai.interaction', { courseIdBody: 'courseId' })
	async generateQuiz(
		@Body() data: GenerateQuizDto,
		@CurrentUser() user: UserPayload
	): Promise<GeneratedQuizResponseDto> {
		const generatedQuiz = await this.generateQuizUseCase.execute(data, user.id);
		return GeneratedQuizResponseDto.fromDomain(generatedQuiz);
	}

	// 2. Rotas Específicas (COM ID)

	@Post('/:id/generate-audio')
	@RequireAccess('ai.interaction', { lessonIdParam: 'id' })
	generateLessonAudio(
		@Param('id') lessonId: string,
		@Body() data: GenerateLessonAudioDto,
		@CurrentUser() user: UserPayload
	) {
		return this.generateAudio.execute({
			lessonId,
			audioProvider: data.ai?.provider || 'openai',
			audioVoiceId: data.audioVoiceId,
			userId: user.id,
		});
	}

	@Post('/:id/video')
	@RequireAccess('ai.interaction', { lessonIdParam: 'id' })
	generateLessonVideo(
		@Param('id') lessonId: string,
		@Body() body,
		@CurrentUser() user: UserPayload
	) {
		void (async () => {
			try {
				await this.generateAudio.execute({
					lessonId,
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

	@Post('/:id/merge-videos')
	@RequireAccess('ai.interaction', { lessonIdParam: 'id' })
	async mergeLessonSectionsVideo(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	) {
		return this.mergeLessonSectionsVideoUseCase.execute(lessonId, user.id);
	}

	@Post('/:id/assets/audio')
	@RequireAccess('lesson.assets.manage', { lessonIdParam: 'id' })
	@UseInterceptors(FileInterceptor('file'))
	async uploadAudio(
		@Param('id') lessonId: string,
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() user: UserPayload
	): Promise<{ path: string; url: string }> {
		return this.manageLessonAssetsUseCase.uploadAudio({
			lessonId,
			userId: user.id,
			file,
		});
	}

	@Post('/:id/assets/pdf')
	@RequireAccess('lesson.assets.manage', { lessonIdParam: 'id' })
	@UseInterceptors(FileInterceptor('file'))
	async uploadPdf(
		@Param('id') lessonId: string,
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() user: UserPayload
	): Promise<{ path: string; url: string }> {
		return this.manageLessonAssetsUseCase.uploadPdf({
			lessonId,
			userId: user.id,
			file,
		});
	}

	@Delete('/:id/assets/audio')
	@RequireAccess('lesson.assets.manage', { lessonIdParam: 'id' })
	@HttpCode(200)
	async deleteAudio(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	): Promise<{ message: string }> {
		await this.manageLessonAssetsUseCase.deleteAudio({
			lessonId,
			userId: user.id,
		});

		return {
			message: 'Áudio removido com sucesso',
		};
	}

	@Delete('/:id/assets/pdf')
	@RequireAccess('lesson.assets.manage', { lessonIdParam: 'id' })
	@HttpCode(200)
	async deletePdf(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	): Promise<{ message: string }> {
		await this.manageLessonAssetsUseCase.deletePdf({
			lessonId,
			userId: user.id,
		});

		return {
			message: 'PDF removido com sucesso',
		};
	}

	// 3. Rotas Genéricas (CRUD) - Devem vir POR ÚLTIMO

	@Get('/:id')
	@RequireAccess('lesson.read', { lessonIdParam: 'id' })
	async getLesson(
		@Param('id') lessonId: string,
		@CurrentUser() user: UserPayload
	): Promise<LessonResponseDto> {
		const lesson = await this.getLessonUseCase.execute(lessonId, user.id);
		return LessonResponseDto.fromDomain(lesson);
	}

	@Put('/:id')
	@RequireAccess('lesson.update', { lessonIdParam: 'id' })
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
