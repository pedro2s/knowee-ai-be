import {
	HistoryRepository,
	HISTORY_REPOSITORY,
} from '@history/domain/ports/history.repository.port';
import { AuthContext } from '@shared/database/application/ports/db-context.port';
import { Inject, Injectable } from '@nestjs/common';
import { HistoryMessageEntity } from '@history/domain/entities/history-message.entity';

const MAX_WINDOW_MESSAGES = 10;

@Injectable()
export class HistoryService {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepository,
	) {}

	public getWindowMessages(context: AuthContext, courseId: string) {
		return this.historyRepository.findWindowMessages(
			context,
			courseId,
			MAX_WINDOW_MESSAGES,
		);
	}

	public getSummary(context: AuthContext, courseId: string) {
		return this.historyRepository.findSummary(context, courseId);
	}

	public async shouldSummarizeHistory(
		context: AuthContext,
		courseId: string,
	): Promise<boolean> {
		const messageCount = await this.historyRepository.countMessages(
			context,
			courseId,
		);
		return messageCount > MAX_WINDOW_MESSAGES;
	}

	public saveMessage(
		context: AuthContext,
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
	): Promise<void> {
		const message = new HistoryMessageEntity(role, content);
		return this.historyRepository.saveMessage(context, courseId, message);
	}

	public saveSummary(
		context: AuthContext,
		courseId: string,
		summary: string,
	): Promise<void> {
		return this.historyRepository.saveSummary(context, courseId, summary);
	}
}
