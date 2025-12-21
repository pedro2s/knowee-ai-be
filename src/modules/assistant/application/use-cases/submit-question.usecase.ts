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

		const answer = await this.aiAssistant.ask(question, {
			summary: summary.summary,
			history: window.map((h) => h.toPlain()),
		});

		await this.historyService.saveMessage(auth, courseId, 'user', question);
		await this.historyService.saveMessage(
			auth,
			courseId,
			'assistant',
			answer.content,
		);

		const qaEntity = QuestionAnswer.create({
			courseId: courseId,
			question: question,
			answer: answer,
		});
		await this.questionAnswerRepository.create(qaEntity, auth);

		this.summarizeHistoryIfNeeded(auth, courseId);

		return answer;
	}

	private async summarizeHistoryIfNeeded(
		auth: AuthContext,
		courseId: string,
	) {
		const shouldSummarize =
			await this.historyService.shouldSummarizeHistory(auth, courseId);

		if (shouldSummarize) {
			const summary = await this.historyService.getSummary(
				auth,
				courseId,
			);
			const window = await this.historyService.getWindowMessages(
				auth,
				courseId,
			);
			const newSummary = await this.aiAssistant.summarize(
				window.map((h) => h.toPlain()),
				summary.summary,
			);
			await this.historyService.saveSummary(
				auth,
				courseId,
				newSummary.content,
			);
		}
	}
}
