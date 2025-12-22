import { Inject, Injectable } from '@nestjs/common';
import {
	QUESTION_ANSWER_REPOSITORY,
	type QuestionAnswerRepositoryPort,
} from '../../domain/ports/question-anwer-repository.port';
import { HistoryService } from 'src/modules/history/application/services/history.service';
import { SubmitQuestionDto } from '../dtos/submit-question.dto';
import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { ProviderRegistry } from '../../infrastructure/providers/provider.resgistre';

@Injectable()
export class SubmitQuestionUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(QUESTION_ANSWER_REPOSITORY)
		private readonly questionAnswerRepository: QuestionAnswerRepositoryPort,
		private readonly historyService: HistoryService,
	) {}

	async execute(input: SubmitQuestionDto, auth: AuthContext) {
		const { courseId, question } = input;

		const summary = await this.historyService.getSummary(auth, courseId);
		const window = await this.historyService.getWindowMessages(
			auth,
			courseId,
		);

		const aiAssistant = this.providerRegistry.getAIAssistantStrategy(
			input.provider,
		);

		const answer = await aiAssistant.ask(question, {
			summary: summary.summary,
			history: window.map((h) => h.toPlain()),
		});

		await this.historyService.saveMessage(auth, courseId, 'user', question);
		await this.historyService.addMessageAndSummarizeIfNecessary(
			auth,
			courseId,
			'assistant',
			answer.content,
		);

		const qaEntity = QuestionAnswer.create({
			userId: auth.userId,
			courseId: courseId,
			question: question,
			answer: answer.content,
		});
		await this.questionAnswerRepository.create(qaEntity, auth);

		return answer;
	}
}
