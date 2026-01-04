import { Inject, Injectable } from '@nestjs/common';
import { SummarizeHistoryPort } from 'src/modules/history/domain/ports/summarize-history.port';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAISummarizeHistoryAdapter implements SummarizeHistoryPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async summarize(textToSummarize: string): Promise<string> {
		const summaryCompletion = await this.openai.chat.completions.create({
			model: 'gpt-4o-mini',
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
			max_tokens: 400,
			temperature: 0,
		});

		const summary = summaryCompletion.choices[0].message.content?.trim();
		return summary || '';
	}
}
