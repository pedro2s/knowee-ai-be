import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';
import { DrizzleCourseRepository } from './infrastructure/persistence/drizzle/drizzle-course.repository';
import { CreateCourseUseCase } from './application/use-cases/create-corse.usecase';
import { AIModule } from '../../shared/ai/ai.module';
import { DrizzleLessonRepository } from './infrastructure/persistence/drizzle/drizzle-lesson.repository';
import { MediaModule } from 'src/shared/media/media.module';
import { LESSON_REPOSITORY } from './domain/ports/lesson-repository.port';
import { COURSE_REPOSITORY } from './domain/ports/course-repository.port';
import { DatabaseModule } from 'src/shared/database/database.module';
import { CoursesController } from './infrastructure/controllers/courses.controller';
import { LessonsController } from './infrastructure/controllers/lessons.controller';
import { FetchCoursesUseCase } from './application/use-cases/fetch-courses.usecase';
import { GetCourseUseCase } from './application/use-cases/get-course.usecase';
import { ProviderRegistry } from './infrastructure/providers/provider.registry';
import { OpenAICourseGeneratorAdapter } from './infrastructure/providers/openai/openai-course-generator.adapter';
import { OpenAIScriptGeneratorAdapter } from './infrastructure/providers/openai/openai-script-generator.adapter';
import { OpenAIAudioGeneratorAdapter } from './infrastructure/providers/openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './infrastructure/providers/openai/openai-image-generator.adapter';
import { ModulesController } from './infrastructure/controllers/modules.controller';
import { FetchLessonsUseCase } from './application/use-cases/fetchLessons.usecase';
import { GetLessonUseCase } from './application/use-cases/get-lesson.usecase';

@Module({
	controllers: [CoursesController, ModulesController, LessonsController],
	imports: [DatabaseModule, AIModule, MediaModule],
	providers: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		GetCourseUseCase,
		GetLessonUseCase,
		FetchCoursesUseCase,
		FetchLessonsUseCase,
		CreateCourseUseCase,
		GenerateLessonAudioUseCase,
		GenerateLessonAudioUseCase,
		ProviderRegistry,
		OpenAICourseGeneratorAdapter,
		OpenAIScriptGeneratorAdapter,
		OpenAIAudioGeneratorAdapter,
		OpenAIImageGeneratorAdapter,
	],
})
export class CourseAuthoringModule {}
