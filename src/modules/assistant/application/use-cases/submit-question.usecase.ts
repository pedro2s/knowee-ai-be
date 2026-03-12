import { Inject, Injectable } from '@nestjs/common';
import {
	QUESTION_ANSWER_REPOSITORY,
	type QuestionAnswerRepositoryPort,
} from '../../domain/ports/question-anwer-repository.port';
import { SubmitQuestionDto } from '../dtos/submit-question.dto';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { HistoryServicePort } from 'src/shared/history/domain/ports/history-service.port';

@Injectable()
export class SubmitQuestionUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(QUESTION_ANSWER_REPOSITORY)
		private readonly questionAnswerRepository: QuestionAnswerRepositoryPort,
		private readonly historyService: HistoryServicePort
	) {}

	async execute(input: SubmitQuestionDto, userId: string) {
		const { courseId, question } = input;

		const auth: AuthContext = {
			userId: userId,
			role: 'authenticated',
		};

		const summary = await this.historyService.getSummary(courseId, auth);
		const window = await this.historyService.getWindowMessages(courseId, auth);

		const aiAssistant = this.providerRegistry.getAIAssistantStrategy(
			input.provider || 'openai'
		);

		const { content: questionAnswered } = await aiAssistant.ask({
			input: { question },
			summary: summary || null,
			recentHistory: window,
		});

		await this.historyService.saveMessage(courseId, 'user', question, auth);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			courseId,
			'assistant',
			questionAnswered.answer,
			auth
		);

		const qaEntity = QuestionAnswer.create({
			userId: auth.userId,
			courseId: courseId,
			question: question,
			answer: questionAnswered.answer,
		});
		await this.questionAnswerRepository.create(qaEntity, auth);

		return questionAnswered;
	}
}
