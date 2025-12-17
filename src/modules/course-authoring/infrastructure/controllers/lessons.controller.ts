import { Body, Controller, Param, Post } from '@nestjs/common';
import { GeneratorLessonVideoUseCase } from 'src/course-authoring/application/use-cases/generate-lesson-video.usecase';

@Controller('lessons')
export class LessonsController {
	constructor(private readonly generateVideo: GeneratorLessonVideoUseCase) {}

	@Post(':id/video')
	async geneateLessonVideo(@Param('id') lessonId: string, @Body() body) {
		this.generateVideo.execute({
			lessonId,
			imageProvider: body.imageProvider,
			audioProvider: body.audioProvider,
		});

		return {
			message: 'Geração de vídeo iniciada',
		};
	}
}
