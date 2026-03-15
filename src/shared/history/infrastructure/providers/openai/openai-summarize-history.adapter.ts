import { Inject, Injectable, Logger } from '@nestjs/common';
import { SummarizeHistoryPort } from 'src/shared/history/domain/ports/summarize-history.port';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { InteractionResult } from 'src/shared/types/interaction';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAISummarizeHistoryAdapter implements SummarizeHistoryPort {
	private readonly logger = new Logger(OpenAISummarizeHistoryAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async summarize(textToSummarize: string): Promise<InteractionResult<string>> {
		const policy = this.llmExecutionPolicy.resolve(
			'history.summarize',
			'openai'
		);
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para history.summarize com modelo ${policy.model}`
			);
		}

		const summaryCompletion = await this.openai.chat.completions.create({
			model: policy.model,
			messages: [
				{
					role: 'system',
					content:
						'Resuma toda a conversa de forma objetiva, mantendo apenas informações úteis para a continuação da criação do curso. Não inclua markdown, apenas texto plano.',
				},
				{
					role: 'user',
					content: textToSummarize,
				},
			],
			...(policy.maxCompletionTokens !== undefined
				? { max_completion_tokens: policy.maxCompletionTokens }
				: {}),
			...(policy.temperature !== undefined
				? { temperature: policy.temperature }
				: {}),
		});

		const summary = summaryCompletion.choices[0].message.content?.trim();
		return {
			content: summary || '',
			tokenUsage: buildOpenAITextUsage({
				model: policy.model,
				operation: 'history.summarize',
				modality: 'history_summary',
				usage: summaryCompletion.usage,
			}),
		};
	}
}
