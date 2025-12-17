import { Body, Controller, Param, Post } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';

@Controller('lessons')
export class LessonsController {
	constructor(private readonly generateAudio: GenerateLessonAudioUseCase) {} // Updated injected type and name

	@Post(':id/video')
	async geneateLessonVideo(@Param('id') lessonId: string, @Body() body) {
		this.generateAudio.execute({
			// Updated method call
			lessonId,
			imageProvider: body.imageProvider,
			audioProvider: body.audioProvider,
		});

		return {
			message: 'Geração de vídeo iniciada',
		};
	}
}
