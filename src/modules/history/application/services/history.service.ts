import {
	HISTORY_REPOSITORY,
	type HistoryRepository,
} from 'src/modules/history/domain/ports/history.repository.port';
import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { Inject, Injectable } from '@nestjs/common';
import { History } from 'src/modules/history/domain/entities/history.entity';
import { HistoryMessage } from '../../domain/value-objects/history-message.vo';

const MAX_WINDOW_MESSAGES = 10;

@Injectable()
export class HistoryService {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepository,
	) {}

	public getWindowMessages(context: AuthContext, courseId: string) {
		return this.historyRepository.findWindowMessages(
			courseId,
			MAX_WINDOW_MESSAGES,
			context,
		);
	}

	public getSummary(context: AuthContext, courseId: string) {
		return this.historyRepository.findSummary(courseId, context);
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
		const message = new HistoryMessage(role, content);
		return this.historyRepository.saveMessage(context, courseId, message);
	}

	public saveSummary(
		context: AuthContext,
		courseId: string,
		summary: string,
	): Promise<void> {
		return this.historyRepository.saveSummary(courseId, summary, context);
	}
}
