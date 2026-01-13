import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';
import { DrizzleCourseRepository } from './infrastructure/persistence/drizzle/drizzle-course.repository';
import { GenerateCourseUseCase } from './application/use-cases/generate-course.usecase';
import { AIModule } from 'src/shared/infrastructure/ai/ai.module';
import { DrizzleLessonRepository } from './infrastructure/persistence/drizzle/drizzle-lesson.repository';
import { MediaModule } from 'src/shared/infrastructure/media/media.module';
import { LESSON_REPOSITORY } from './domain/ports/lesson-repository.port';
import { COURSE_REPOSITORY } from './domain/ports/course-repository.port';
import { DatabaseModule } from 'src/shared/infrastructure/database/database.module';
import { CoursesController } from './infrastructure/controllers/courses.controller';
import { LessonsController } from './infrastructure/controllers/lessons.controller';
import { FetchCoursesUseCase } from './application/use-cases/fetch-courses.usecase';
import { GetCourseUseCase } from './application/use-cases/get-course.usecase';
import { ProviderRegistry } from './infrastructure/providers/provider.registry';
import { OpenAICourseGeneratorAdapter } from './infrastructure/providers/openai/openai-course-generator.adapter';
import { OpenAIAudioGeneratorAdapter } from './infrastructure/providers/openai/openai-audio-generator.adapter';
import { OpenAIImageGeneratorAdapter } from './infrastructure/providers/openai/openai-image-generator.adapter';
import { ModulesController } from './infrastructure/controllers/modules.controller';
import { FetchLessonsUseCase } from './application/use-cases/fetchLessons.usecase';
import { GetLessonUseCase } from './application/use-cases/get-lesson.usecase';
import { MODULE_REPOSITORY } from './domain/ports/module-repository.port';
import { DrizzleModuleRepository } from './infrastructure/persistence/drizzle/drizzle-module.repository';
import { FetchModulesUseCase } from './application/use-cases/fetch-modules.usecase';
import { CreateModuleUseCase } from './application/use-cases/create-module.usecase';
import { DeleteModuleUseCase } from './application/use-cases/delete-module.usecase';
import { UpdateModuleUseCase } from './application/use-cases/update-module.usecase';
import { HistoryModule } from '../history/history.module';
import { FileProcessingModule } from 'src/shared/infrastructure/file-processing/file-processing.module';
import { EmbeddingModule } from 'src/shared/infrastructure/embeddings/embedding.module';
import { TokenUsageModule } from 'src/shared/infrastructure/token-usage/token-usage.module';
import { GeneratorLessonVideoUseCase } from './application/use-cases/generate-lesson-video.usecase';
import { UpdateCourseWithModuleTreeUseCase } from './application/use-cases/update-course-with-module-tree.usecase';
import { UpdateLessonUseCase } from './application/use-cases/update-lesson.usecase';
import { QuickActionsController } from './infrastructure/controllers/quick-actions.controller';
import { GenerateModuleUseCase } from './application/use-cases/generate-module.usecase';
import { OpenAIModuleGeneratorAdapter } from './infrastructure/providers/openai/openai-module-generator.adapter';
import { OpenAIArticleGeneratorAdapter } from './infrastructure/providers/openai/openai-article-generator.adapter';
import { GenerateArticleUseCase } from './application/use-cases/generate-article.usecase';
import { OpenAILessonScriptGeneratorAdapter } from './infrastructure/providers/openai/openai-lesson-script-generator.adapter';
import { GenerateLessonScriptUseCase } from './application/use-cases/generate-lesson-script.usecase';

@Module({
	controllers: [
		CoursesController,
		ModulesController,
		LessonsController,
		QuickActionsController,
	],
	imports: [
		DatabaseModule,
		AIModule,
		MediaModule,
		HistoryModule,
		EmbeddingModule,
		FileProcessingModule,
		TokenUsageModule,
	],
	providers: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		{ provide: MODULE_REPOSITORY, useClass: DrizzleModuleRepository },
		GenerateCourseUseCase,
		GenerateModuleUseCase,
		GenerateArticleUseCase,
		GenerateLessonScriptUseCase,
		CreateModuleUseCase,
		GetCourseUseCase,
		GetLessonUseCase,
		FetchCoursesUseCase,
		FetchModulesUseCase,
		FetchLessonsUseCase,
		UpdateCourseWithModuleTreeUseCase,
		UpdateModuleUseCase,
		UpdateLessonUseCase,
		DeleteModuleUseCase,
		GenerateLessonAudioUseCase,
		GeneratorLessonVideoUseCase,
		ProviderRegistry,
		OpenAICourseGeneratorAdapter,
		OpenAIModuleGeneratorAdapter,
		OpenAIAudioGeneratorAdapter,
		OpenAIImageGeneratorAdapter,
		OpenAIArticleGeneratorAdapter,
		OpenAILessonScriptGeneratorAdapter,
	],
	exports: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		{ provide: MODULE_REPOSITORY, useClass: DrizzleModuleRepository },
	],
})
export class CourseAuthoringModule {}
