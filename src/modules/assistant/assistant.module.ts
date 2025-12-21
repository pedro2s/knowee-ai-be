import { Module } from '@nestjs/common';
import { AssistantController } from './infrastructure/controllers/assistant.controller';
import { GetChatHistoryUseCase } from './application/use-cases/get-chat-history.usecase';
import { QUESTION_ANSWER_REPOSITORY } from './domain/ports/question-anwer-repository.port';
import { DrizzleQuestionAnswerRepository } from './infrastructure/persistence/drizzle/drizzle-question-answer.repository';
import { DatabaseModule } from 'src/shared/database/database.module';

@Module({
	controllers: [AssistantController],
	imports: [DatabaseModule],
	providers: [
		{
			provide: QUESTION_ANSWER_REPOSITORY,
			useClass: DrizzleQuestionAnswerRepository,
		},
		GetChatHistoryUseCase,
	],
})
export class AssistantModule {}
