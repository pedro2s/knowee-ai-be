import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
	AIAssistantPort,
	AskQuestionInput,
} from 'src/modules/assistant/domain/ports/ai-assistant.port';
import { QuestionAnswered } from 'src/modules/assistant/domain/entities/question-answer.types';
import { ChatCompletionMessageParam } from 'openai/resources';
import { OPENAI_CLIENT } from 'src/shared/ai/ai.constants';

@Injectable()
export class OpenAIAssistantAdapter implements AIAssistantPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async ask(input: AskQuestionInput): Promise<QuestionAnswered> {
		const { question, context } = input;

		const messages: ChatCompletionMessageParam[] = [];

		messages.push({
			role: 'system',
			content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.
Você pode sugerir ações automatizadas (como criar módulo, adicionar aula, etc.) usando as funções disponíveis quando todos os parâmetros obrigatórios (como course_id, module_id, etc.) existirem.
Sempre peça confirmação do usuário antes de executar ações sensíveis.
Caso contrário, devolva respostas sem formatação markdown.`,
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
			content: `Pergunta do usuário:\n${question}`,
		});

		const completion = await this.openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: messages,
		});

		const answer = completion.choices[0].message.content || '';

		return {
			content: answer,
		};
	}
}
