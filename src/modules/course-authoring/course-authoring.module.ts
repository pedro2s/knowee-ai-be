import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';
import { DrizzleCourseRepository } from './infrastructure/persistence/drizzle/drizzle-course.repository';
import { CreateCourseUseCase } from './application/use-cases/create-corse.usecase';
import { AIModule } from '../ai/ai.module';
import { DrizzleLessonRepository } from './infrastructure/persistence/drizzle/drizzle-lesson.repository';
import { MediaModule } from 'src/shared/media/media.module';
import { LESSON_REPOSITORY } from './domain/ports/lesson-repository.port';
import { COURSE_REPOSITORY } from './domain/ports/course-repository.port';
import { DatabaseModule } from 'src/shared/database/database.module';
import { CoursesController } from './infrastructure/controllers/courses.controller';
import { LessonsController } from './infrastructure/controllers/lessons.controller';
import { FetchCoursesUseCase } from './application/use-cases/fetch-courses.usecase';
import { GetCourseUseCase } from './application/use-cases/get-course.usecase';

@Module({
	controllers: [CoursesController, LessonsController],
	imports: [DatabaseModule, AIModule, MediaModule],
	providers: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		GetCourseUseCase,
		FetchCoursesUseCase,
		CreateCourseUseCase,
		GenerateLessonAudioUseCase,
		GenerateLessonAudioUseCase,
	],
})
export class CourseAuthoringModule {}
