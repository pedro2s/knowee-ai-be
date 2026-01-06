import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
	GenerateTextInput,
	GeneratedTextOutput,
} from 'src/modules/assistant/domain/entities/generate-text.types';
import { TextGeneratorPort } from 'src/modules/assistant/domain/ports/text-generator.port';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAITextGeneratorAdapter implements TextGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(input: GenerateTextInput): Promise<GeneratedTextOutput> {
		const { prompt, context } = input;

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
			[];

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
			content: `${prompt}`,
		});

		const completion = await this.openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: messages,
		});

		const content = completion.choices[0].message.content || '';

		return {
			text: content,
		};
	}
}
