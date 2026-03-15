import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	GenerateTextInput,
	GeneratedTextOutput,
} from 'src/modules/assistant/domain/entities/generate-text.types';
import { TextGeneratorPort } from 'src/modules/assistant/domain/ports/text-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';

@Injectable()
export class OpenAITextGeneratorAdapter implements TextGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(
		context: InteractionContext<GenerateTextInput>
	): Promise<InteractionResult<GeneratedTextOutput>> {
		const { input } = context;

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

		messages.push({
			role: 'system',
			content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.
Certifique-se de responder de forma clara e concisa. Devolva apenas a resposta sem introdução, sem comentários, sem citações e sem formatação markdown.`,
		});

		// Adiciona o resumo como parte do contexto inicial, se existir
		if (context?.summary) {
			messages.push({
				role: 'system',
				content: `Aqui está um resumo da conversa até agora:\n${context.summary}`,
			});
		}

		// Adiciona o histórico recente
		if (context?.recentHistory) {
			for (const history of context.recentHistory) {
				const { role, content } = history.toPrimitives().message;
				messages.push({ role: role as any, content });
			}
		}

		// Adiciona a pergunta atual do usuário
		messages.push({
			role: 'user',
			content: `${input.prompt}`,
		});

		const model: ChatModel = 'gpt-4o-mini';

		const completion = await this.openai.chat.completions.create({
			model: model,
			messages: messages,
		});

		const content = completion.choices[0].message.content || '';

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'assistant.generate_text',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: { text: content },
			tokenUsage,
		};
	}
}
