import {
	HISTORY_REPOSITORY,
	type HistoryRepositoryPort,
} from 'src/modules/history/domain/ports/history-repository.port';
import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { Inject, Injectable } from '@nestjs/common';
import { History } from 'src/modules/history/domain/entities/history.entity';
import { HistoryMessage } from '../../domain/value-objects/history-message.vo';
import {
	HISTORY_SUMMARY_REPOSITORY,
	type HistorySummaryRepositoryPort,
} from '../../domain/ports/history-summary-repository.port';

const MAX_WINDOW_MESSAGES = 10;

@Injectable()
export class HistoryService {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepositoryPort,
		@Inject(HISTORY_SUMMARY_REPOSITORY)
		private readonly historySummaryRepository: HistorySummaryRepositoryPort,
	) {}

	public getWindowMessages(context: AuthContext, courseId: string) {
		return this.historyRepository.findWindowMessages(
			courseId,
			MAX_WINDOW_MESSAGES,
			context,
		);
	}

	public getSummary(context: AuthContext, courseId: string) {
		return this.historySummaryRepository.findSummary(courseId, context);
	}

	public async shouldSummarizeHistory(
		context: AuthContext,
		courseId: string,
	): Promise<boolean> {
		const messageCount = await this.historyRepository.countMessages(
			courseId,
			context,
		);
		return messageCount > MAX_WINDOW_MESSAGES;
	}

	public saveMessage(
		context: AuthContext,
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
	): Promise<void> {
		const message = HistoryMessage.create(role, content);
		const history = History.create({
			userId: context.userId,
			courseId,
			message,
		});
		return this.historyRepository.saveMessage(courseId, history, context);
	}

	public saveSummary(
		context: AuthContext,
		courseId: string,
		summary: string,
	): Promise<void> {
		return this.historyRepository.saveSummary(courseId, summary, context);
	}
}
