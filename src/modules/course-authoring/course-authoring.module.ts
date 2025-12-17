import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';

@Module({
	providers: [GenerateLessonAudioUseCase],
})
export class CourseAuthoringModule {}
