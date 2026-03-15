import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
	AIAssistantPort,
	AskQuestionInput,
} from 'src/modules/assistant/domain/ports/ai-assistant.port';
import {
	AssistantModelAnswer,
	AssistantToolDefinition,
} from 'src/modules/assistant/domain/entities/assistant-tool.types';
import { ChatCompletionMessageParam, ChatModel } from 'openai/resources';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';

@Injectable()
export class OpenAIAssistantAdapter implements AIAssistantPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async ask(
		context: InteractionContext<AskQuestionInput>
	): Promise<InteractionResult<AssistantModelAnswer>> {
		const { input } = context;

		const messages: ChatCompletionMessageParam[] = [];

		messages.push({
			role: 'system',
			content: `Você é um assistente especializado em criação de cursos educacionais.
Seu objetivo é ajudar a melhorar o curso atual e acionar ferramentas quando houver intenção executável.

Regras obrigatórias:
- Quando o usuário pedir para criar um módulo e houver informações suficientes na mensagem atual ou no contexto recente, chame a ferramenta create_module.
- Não responda com um resumo pedindo confirmação em linguagem natural se já for possível montar uma chamada válida de create_module.
- Use somente o formato exato de argumentos da ferramenta.
- O curso atual já é conhecido pelo servidor. Nunca invente ou dependa de course_id para decidir a chamada.
- Se o usuário colar uma especificação textual de módulo com aulas, converta isso para os campos estruturados da ferramenta.
- Reaproveite dados já presentes na conversa; não peça novamente informações que já estejam disponíveis.
- Se faltarem campos obrigatórios, responda normalmente explicando exatamente o que falta.
- Sempre responda sem markdown quando não estiver chamando ferramenta.
- Nunca execute ações sensíveis por conta própria fora do fluxo de confirmação do backend.`,
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
			content: `Pergunta do usuário:\n${input.question}`,
		});

		const model: ChatModel = 'gpt-4o-mini';

		const tools = ((context.tools ?? []) as AssistantToolDefinition[]).map(
			(tool): ChatCompletionTool => ({
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
				},
			})
		);

		const completion = await this.openai.chat.completions.create({
			model: model,
			messages: messages,
			...(tools.length > 0
				? {
						tools,
						tool_choice: 'auto' as const,
					}
				: {}),
		});

		const message = completion.choices[0].message;
		const answer = message.content || '';
		const firstToolCall = message.tool_calls?.[0];

		const toolCall =
			firstToolCall?.type === 'function'
				? {
						name: firstToolCall.function.name,
						arguments: JSON.parse(firstToolCall.function.arguments) as Record<
							string,
							unknown
						>,
					}
				: undefined;

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'assistant.submit_question',
			modality: 'text',
			usage: completion.usage,
			metadata: {
				hasToolCall: !!toolCall,
			},
		});

		return {
			content: {
				answer,
				toolCall,
			},
			tokenUsage,
		};
	}
}
