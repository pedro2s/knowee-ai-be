import { Module } from '@nestjs/common';
import { GeneratorLessonVideoUseCase } from './application/use-cases/generate-lesson-audio.usecase';

@Module({
	providers: [GeneratorLessonVideoUseCase],
})
export class CourseAuthoringModule {}
