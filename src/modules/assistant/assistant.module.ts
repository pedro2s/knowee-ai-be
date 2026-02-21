import { Module } from '@nestjs/common';
import { AssistantController } from './infrastructure/controllers/assistant.controller';
import { GetChatHistoryUseCase } from './application/use-cases/get-chat-history.usecase';
import { QUESTION_ANSWER_REPOSITORY } from './domain/ports/question-anwer-repository.port';
import { DrizzleQuestionAnswerRepository } from './infrastructure/persistence/drizzle/drizzle-question-answer.repository';
import { DatabaseModule } from 'src/shared/database/database.module';
import { SubmitQuestionUseCase } from './application/use-cases/submit-question.usecase';
import { HistoryModule } from 'src/modules/history/history.module';
import { AIModule } from 'src/shared/infrastructure/ai/ai.module';
import { ProviderRegistry } from './infrastructure/providers/provider.registry';
import { OpenAIAssistantAdapter } from './infrastructure/providers/openai/openai-assistant.adapter';
import { GenerateTextUseCase } from './application/use-cases/generate-text.usecase';
import { OpenAITextGeneratorAdapter } from './infrastructure/providers/openai/openai-text-generator.adapter';
import { TokenUsageModule } from 'src/shared/infrastructure/token-usage/token-usage.module';
import { OpenAIAnalyticsAdapter } from './infrastructure/providers/openai/openai-analytics.adapter';
import { AnalyticsUseCase } from './application/use-cases/analytics.usecase';
import { GenAIAnalyticsAdapter } from './infrastructure/providers/genai/gemini-analytics.adapter';

@Module({
	controllers: [AssistantController],
	imports: [DatabaseModule, HistoryModule, AIModule, TokenUsageModule],
	providers: [
		{
			provide: QUESTION_ANSWER_REPOSITORY,
			useClass: DrizzleQuestionAnswerRepository,
		},
		GetChatHistoryUseCase,
		SubmitQuestionUseCase,
		GenerateTextUseCase,
		AnalyticsUseCase,
		ProviderRegistry,
		OpenAIAssistantAdapter,
		OpenAITextGeneratorAdapter,
		OpenAIAnalyticsAdapter,
		GenAIAnalyticsAdapter,
	],
})
export class AssistantModule {}
