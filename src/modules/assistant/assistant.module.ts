import { Module } from '@nestjs/common';
import { AssistantController } from './infrastructure/controllers/assistant.controller';
import { GetChatHistoryUseCase } from './application/use-cases/get-chat-history.usecase';
import { QUESTION_ANSWER_REPOSITORY } from './domain/ports/question-anwer-repository.port';
import { DrizzleQuestionAnswerRepository } from './infrastructure/persistence/drizzle/drizzle-question-answer.repository';
import { DatabaseModule } from 'src/shared/database/database.module';
import { SubmitQuestionUseCase } from './application/use-cases/submit-question.usecase.ts';
import { HistoryModule } from 'src/modules/history/history.module';
import { AiModule } from 'src/shared/ai/ai.module';

@Module({
	controllers: [AssistantController],
	imports: [DatabaseModule, HistoryModule, AiModule],
	providers: [
		{
			provide: QUESTION_ANSWER_REPOSITORY,
			useClass: DrizzleQuestionAnswerRepository,
		},
		GetChatHistoryUseCase,
		SubmitQuestionUseCase,
	],
})
export class AssistantModule {}
