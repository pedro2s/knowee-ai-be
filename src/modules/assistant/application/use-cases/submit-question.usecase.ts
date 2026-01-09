import { Inject, Injectable } from '@nestjs/common';
import {
	QUESTION_ANSWER_REPOSITORY,
	type QuestionAnswerRepositoryPort,
} from '../../domain/ports/question-anwer-repository.port';
import { SubmitQuestionDto } from '../dtos/submit-question.dto';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';

@Injectable()
export class SubmitQuestionUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(QUESTION_ANSWER_REPOSITORY)
		private readonly questionAnswerRepository: QuestionAnswerRepositoryPort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort
	) {}

	async execute(input: SubmitQuestionDto, userId: string) {
		const { courseId, question } = input;

		const auth: AuthContext = {
			userId: userId,
			role: 'authenticated',
		};

		const summary = await this.historyService.getSummary(auth, courseId);
		const window = await this.historyService.getWindowMessages(auth, courseId);

		const aiAssistant = this.providerRegistry.getAIAssistantStrategy(
			input.provider || 'openai'
		);

		const { content: questionAnswered, tokenUsage } = await aiAssistant.ask({
			input: { question },
			summary: summary || null,
			recentHistory: window,
		});

		await this.historyService.saveMessage(auth, courseId, 'user', question);
		await this.historyService.saveMessageAndSummarizeIfNecessary(
			auth,
			courseId,
			'assistant',
			questionAnswered.answer
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
