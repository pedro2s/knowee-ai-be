import { Module } from '@nestjs/common';
import { GenerateLessonAudioUseCase } from './application/use-cases/generate-lesson-audio.usecase';
import { DrizzleCourseRepository } from './infrastructure/persistence/drizzle/drizzle-course.repository';
import { GenerateCourseUseCase } from './application/use-cases/generate-course.usecase';
import { AIProvidersModule } from 'src/shared/ai-providers/ai-providers.module';
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
import { ModulesController } from './infrastructure/controllers/modules.controller';
import { GetModuleUseCase } from './application/use-cases/get-module.usecase';
import { GetLessonUseCase } from './application/use-cases/get-lesson.usecase';
import { MODULE_REPOSITORY } from './domain/ports/module-repository.port';
import { DrizzleModuleRepository } from './infrastructure/persistence/drizzle/drizzle-module.repository';
import { FetchModulesUseCase } from './application/use-cases/fetch-modules.usecase';
import { CreateModuleUseCase } from './application/use-cases/create-module.usecase';
import { DeleteModuleUseCase } from './application/use-cases/delete-module.usecase';
import { UpdateModuleUseCase } from './application/use-cases/update-module.usecase';
import { HistoryModule } from '../../shared/history/history.module';
import { StorageModule } from 'src/shared/storage/storage.module';
import { TokenUsageModule } from 'src/shared/token-usage/token-usage.module';
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
import { SupabaseModule } from 'src/shared/supabase/supabase.module';
import { OpenAIStoryboardGeneratorAdapter } from './infrastructure/providers/openai/openai-storyboard-generator.adapter';
import { STORYBOARD_GENERATOR } from './domain/ports/storyboard-generator.port';
import { GenerateSectionVideoUseCase } from './application/use-cases/generate-section-video.usecase';
import { MergeLessonSectionsVideoUseCase } from './application/use-cases/merge-lesson-sections-video.usecase';
import { OpenAIReorderContentAgentAdapter } from './infrastructure/providers/openai/openai-reorder-content-agent.adapter';
import { REORDER_CONTENT_AGENT } from './domain/ports/reorder-content-agent.port';
import { ReorderContentUseCase } from './application/use-cases/quick-actions/georder-content.usecase';
import { ReorderLessonsUseCase } from './application/use-cases/reorder-lessons.usecase';
import { ManageLessonAssetsUseCase } from './application/use-cases/manage-lesson-assets.usecase';
import { GenerateQuizUseCase } from './application/use-cases/generate-quiz.usecase';
import { QUIZ_GENERATOR } from './domain/ports/quiz-generator.port';
import { OpenAIQuizGeneratorAdapter } from './infrastructure/providers/openai/openai-quiz-generator.adapter';
import { GenerateAssessmentsUseCase } from './application/use-cases/quick-actions/generate-assessments.usecase';
import { GENERATE_ASSESSMENTS_AGENT } from './domain/ports/generate-assessments-agent.port';
import { OpenAIGenerateAssessmentsAgentAdapter } from './infrastructure/providers/openai/openai-generate-assessments-agent.adapter';
import { ExportCourseScormUseCase } from './application/use-cases/export-course-scorm.usecase';
import { SCORM_PACKAGE_GENERATOR } from './domain/ports/scorm-package-generator.port';
import { ScormPackageGeneratorAdapter } from './infrastructure/providers/scorm/scorm-package-generator.adapter';
import { ScormManifestBuilder } from './infrastructure/providers/scorm/scorm-manifest.builder';
import { StartCourseGenerationUseCase } from './application/use-cases/start-course-generation.usecase';
import { CourseGenerationOrchestratorUseCase } from './application/use-cases/course-generation-orchestrator.usecase';
import { GENERATION_JOB_REPOSITORY } from './domain/ports/generation-job-repository.port';
import { DrizzleGenerationJobRepository } from './infrastructure/persistence/drizzle/drizzle-generation-job.repository';
import { DrizzleGenerationJobPayloadRepository } from './infrastructure/persistence/drizzle/drizzle-generation-job-payload.repository';
import { GenerationEventsService } from './application/services/generation-events.service';
import { GetGenerationJobUseCase } from './application/use-cases/get-generation-job.usecase';
import { GenerationController } from './infrastructure/controllers/generation.controller';
import { GenerateLessonStoryboardUseCase } from './application/use-cases/generate-lesson-storyboard.usecase';
import { ProviderPreferencesModule } from '../provider-preferences/provider-preferences.module';
import { StartAssetsGenerationUseCase } from './application/use-cases/start-assets-generation.usecase';
import { AssetsGenerationOrchestratorUseCase } from './application/use-cases/assets-generation-orchestrator.usecase';
import { GetActiveGenerationJobByCourseUseCase } from './application/use-cases/get-active-generation-job-by-course.usecase';
import { AccessControlModule } from '../access-control/access-control.module';
import { GENERATION_JOB_PAYLOAD_REPOSITORY } from './domain/ports/generation-job-payload-repository.port';
import { GenerationQueueProducer } from './infrastructure/queue/generation-queue.producer';
import { GenerationQueueProcessor } from './infrastructure/queue/generation-queue.processor';
import { StartLessonAudioGenerationUseCase } from './application/use-cases/start-lesson-audio-generation.usecase';
import { StartSectionVideoGenerationUseCase } from './application/use-cases/start-section-video-generation.usecase';
import { StartLessonMergeVideoGenerationUseCase } from './application/use-cases/start-lesson-merge-video-generation.usecase';

const workerProviders =
	process.env.ENABLE_QUEUE_WORKERS === 'true' ? [GenerationQueueProcessor] : [];

@Module({
	controllers: [
		CoursesController,
		ModulesController,
		LessonsController,
		QuickActionsController,
		GenerationController,
	],
	imports: [
		DatabaseModule,
		AIProvidersModule,
		MediaModule,
		HistoryModule,
		StorageModule,
		TokenUsageModule,
		SupabaseModule,
		ProviderPreferencesModule,
		AccessControlModule,
	],
	providers: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		{ provide: MODULE_REPOSITORY, useClass: DrizzleModuleRepository },
		{
			provide: GENERATION_JOB_REPOSITORY,
			useClass: DrizzleGenerationJobRepository,
		},
		{
			provide: GENERATION_JOB_PAYLOAD_REPOSITORY,
			useClass: DrizzleGenerationJobPayloadRepository,
		},
		GenerateCourseUseCase,
		StartCourseGenerationUseCase,
		CourseGenerationOrchestratorUseCase,
		StartAssetsGenerationUseCase,
		StartLessonAudioGenerationUseCase,
		StartSectionVideoGenerationUseCase,
		StartLessonMergeVideoGenerationUseCase,
		AssetsGenerationOrchestratorUseCase,
		GetGenerationJobUseCase,
		GetActiveGenerationJobByCourseUseCase,
		GenerateLessonStoryboardUseCase,
		GenerateModuleUseCase,
		GenerateArticleUseCase,
		GenerateLessonScriptUseCase,
		GenerateSectionVideoUseCase,
		MergeLessonSectionsVideoUseCase,
		CreateModuleUseCase,
		GetCourseUseCase,
		GetLessonUseCase,
		FetchCoursesUseCase,
		FetchModulesUseCase,
		GetModuleUseCase,
		UpdateCourseWithModuleTreeUseCase,
		UpdateModuleUseCase,
		UpdateLessonUseCase,
		DeleteModuleUseCase,
		GenerateLessonAudioUseCase,
		GeneratorLessonVideoUseCase,
		ReorderContentUseCase,
		ReorderLessonsUseCase,
		ManageLessonAssetsUseCase,
		GenerateQuizUseCase,
		GenerateAssessmentsUseCase,
		ExportCourseScormUseCase,
		ProviderRegistry,
		OpenAICourseGeneratorAdapter,
		OpenAIModuleGeneratorAdapter,
		OpenAIArticleGeneratorAdapter,
		OpenAILessonScriptGeneratorAdapter,
		{
			provide: STORYBOARD_GENERATOR,
			useClass: OpenAIStoryboardGeneratorAdapter,
		},
		{
			provide: REORDER_CONTENT_AGENT,
			useClass: OpenAIReorderContentAgentAdapter,
		},
		{
			provide: QUIZ_GENERATOR,
			useClass: OpenAIQuizGeneratorAdapter,
		},
		OpenAIQuizGeneratorAdapter,
		{
			provide: GENERATE_ASSESSMENTS_AGENT,
			useClass: OpenAIGenerateAssessmentsAgentAdapter,
		},
		OpenAIGenerateAssessmentsAgentAdapter,
		ScormManifestBuilder,
		GenerationEventsService,
		GenerationQueueProducer,
		{
			provide: SCORM_PACKAGE_GENERATOR,
			useClass: ScormPackageGeneratorAdapter,
		},
		ScormPackageGeneratorAdapter,
		...workerProviders,
	],
	exports: [
		{ provide: COURSE_REPOSITORY, useClass: DrizzleCourseRepository },
		{ provide: LESSON_REPOSITORY, useClass: DrizzleLessonRepository },
		{ provide: MODULE_REPOSITORY, useClass: DrizzleModuleRepository },
	],
})
export class CourseAuthoringModule {}
