import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';
import { DrizzleCourseRepository } from './infrastructure/persistence/drizzle/repositories/drizzle-course.repository';
import { CreateCourseUseCase } from './application/use-cases/create-corse.usecase';
import { AIModule } from '../ai/ai.module';
import { DrizzleLessonRepository } from './infrastructure/persistence/drizzle/repositories/drizzle-lesson.repository';
import { MediaModule } from 'src/shared/media/media.module';

@Module({
	imports: [AIModule, MediaModule],
	providers: [
		DrizzleCourseRepository,
		DrizzleLessonRepository,
		CreateCourseUseCase,
		GenerateLessonAudioUseCase,
		GenerateLessonAudioUseCase,
	],
})
export class CourseAuthoringModule {}
