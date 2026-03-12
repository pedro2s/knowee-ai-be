import {
	HISTORY_REPOSITORY,
	type HistoryRepositoryPort,
} from 'src/shared/history/domain/ports/history-repository.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { History } from 'src/shared/history/domain/entities/history.entity';
import {
	HISTORY_SUMMARY_REPOSITORY,
	type HistorySummaryRepositoryPort,
} from '../../domain/ports/history-summary-repository.port';
import { OpenAISummarizeHistoryAdapter } from '../providers/openai/openai-summarize-history.adapter';
import { HistorySummary } from '../../domain/entities/history-summary.entity';
import { HistoryServicePort } from '../../domain/ports/history-service.port';

const MAX_WINDOW_MESSAGES = 10;

@Injectable()
export class HistoryService implements HistoryServicePort {
	private readonly logger = new Logger(HistoryService.name);

	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepositoryPort,
		@Inject(HISTORY_SUMMARY_REPOSITORY)
		private readonly historySummaryRepository: HistorySummaryRepositoryPort,
		private readonly openAISumarizeHistory: OpenAISummarizeHistoryAdapter
	) {}

	public async getWindowMessages(courseId: string, context: AuthContext) {
		return this.historyRepository.findWindowHistory(
			courseId,
			MAX_WINDOW_MESSAGES,
			context
		);
	}

	public async getSummary(courseId: string, context: AuthContext) {
		const summary = await this.historySummaryRepository.findHistorySummary(
			courseId,
			context
		);
		return summary?.summary;
	}

	public async shouldSummarizeHistory(
		courseId: string,
		context: AuthContext
	): Promise<boolean> {
		const messageCount = await this.historyRepository.countMessages(
			courseId,
			context
		);
		return messageCount > MAX_WINDOW_MESSAGES;
	}

	public saveMessage(
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
		context: AuthContext
	): Promise<void> {
		const history = History.create({
			userId: context.userId,
			courseId,
			message: { role, content },
		});
		return this.historyRepository.saveHistory(history, context);
	}

	public async saveMessageAndSummarizeIfNecessary(
		courseId: string,
		role: 'user' | 'assistant' | 'system',
		content: string,
		context: AuthContext
	): Promise<void> {
		await this.saveMessage(courseId, role, content, context);

		const shouldSummarize = await this.shouldSummarizeHistory(
			courseId,
			context
		);

		if (shouldSummarize) {
			// Executa em background para não bloquear a resposta ao usuário
			void this.summarizeHistory(courseId, context);
		}
	}

	public async summarizeHistory(
		courseId: string,
		context: AuthContext
	): Promise<void> {
		const history = await this.historyRepository.findHistory(courseId, context);

		if (history.length === 0) {
			this.logger.log(
				`[SummarizeHistoryUseCase] Nenhum histórico encontrado para resumir.`
			);
			return;
		}

		const textToSummarize = history
			.map((h) => {
				const message = h.toPrimitives().message;
				return `${message.role}: ${message.content}`;
			})
			.join('\n');

		const summaryText =
			await this.openAISumarizeHistory.summarize(textToSummarize);

		const summary = HistorySummary.create({
			courseId,
			userId: context.userId,
			summary: summaryText,
		});

		await this.historySummaryRepository.saveHistorySummary(summary, context);
		this.logger.log(`[SummarizeHistoryUseCase] Resumo atualizado.`);

		await this.historyRepository.deleteHistory(courseId, context);
		this.logger.log(`[SummarizeHistoryUseCase] Histórico deletado.`);
	}
}
