import { Module } from '@nestjs/common';
import { AssistantController } from './infrastructure/controllers/assistant.controller';
import { GetChatHistoryUseCase } from './application/use-cases/get-chat-history.usecase';
import { QuestionAnswerRepositoryPort } from './domain/ports/question-anwer-repository.port';
import { DrizzleQuestionAnswerRepository } from './infrastructure/persistence/drizzle/drizzle-question-answer.repository';
import { DatabaseModule } from 'src/shared/database/database.module';
import { SubmitQuestionUseCase } from './application/use-cases/submit-question.usecase';
import { HistoryModule } from 'src/shared/history/history.module';
import { AIProvidersModule } from 'src/shared/ai-providers/ai-providers.module';
import { ProviderRegistry } from './infrastructure/providers/provider.registry';
import { OpenAIAssistantAdapter } from './infrastructure/providers/openai/openai-assistant.adapter';
import { GenerateTextUseCase } from './application/use-cases/generate-text.usecase';
import { OpenAITextGeneratorAdapter } from './infrastructure/providers/openai/openai-text-generator.adapter';
import { TokenUsageModule } from 'src/shared/token-usage/token-usage.module';
import { OpenAIAnalyticsAdapter } from './infrastructure/providers/openai/openai-analytics.adapter';
import { AnalyticsUseCase } from './application/use-cases/analytics.usecase';
import { GenAIAnalyticsAdapter } from './infrastructure/providers/genai/gemini-analytics.adapter';
import { AccessControlModule } from '../access-control/access-control.module';
import { AssistantPendingActionRepositoryPort } from './domain/ports/assistant-pending-action-repository.port';
import { DrizzleAssistantPendingActionRepository } from './infrastructure/persistence/drizzle/drizzle-assistant-pending-action.repository';
import { AssistantToolRegistry } from './application/services/assistant-tool.registry';
import { AssistantToolExecutor } from './application/services/assistant-tool.executor';
import { CourseAuthoringModule } from '../course-authoring/course-authoring.module';
import { LegalModule } from '../legal/legal.module';

@Module({
	controllers: [AssistantController],
	imports: [
		DatabaseModule,
		HistoryModule,
		AIProvidersModule,
		TokenUsageModule,
		AccessControlModule,
		CourseAuthoringModule,
		LegalModule,
	],
	providers: [
		{
			provide: QuestionAnswerRepositoryPort,
			useClass: DrizzleQuestionAnswerRepository,
		},
		{
			provide: AssistantPendingActionRepositoryPort,
			useClass: DrizzleAssistantPendingActionRepository,
		},
		GetChatHistoryUseCase,
		SubmitQuestionUseCase,
		GenerateTextUseCase,
		AnalyticsUseCase,
		AssistantToolRegistry,
		AssistantToolExecutor,
		ProviderRegistry,
		OpenAIAssistantAdapter,
		OpenAITextGeneratorAdapter,
		OpenAIAnalyticsAdapter,
		GenAIAnalyticsAdapter,
	],
})
export class AssistantModule {}
