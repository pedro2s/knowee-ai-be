import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from '../../application/use-cases/generate-lesson-audio.usecase';

@Controller('lessons')
export class LessonsController {
	constructor(private readonly generateAudio: GenerateLessonAudioUseCase) {} // Updated injected type and name

	@Post(':id/video')
	async geneateLessonVideo(
		@Req() req: Request & { user: { id: string } },
		@Param('id') lessonId: string,
		@Body() body,
	) {
		this.generateAudio.execute({
			lessonId,
			imageProvider: body.imageProvider,
			audioProvider: body.audioProvider,
			userId: req.user.id,
		});

		return {
			message: 'Geração de vídeo iniciada',
		};
	}
}
