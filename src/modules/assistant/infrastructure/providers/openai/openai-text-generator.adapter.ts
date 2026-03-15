import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAITextGeneratorAdapter implements TextGeneratorPort {
	private readonly logger = new Logger(OpenAITextGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

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

		const policy = this.llmExecutionPolicy.resolve(
			'assistant.generate_text',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para assistant.generate_text com modelo ${policy.model}`
			);
		}

		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			...(policy.temperature !== undefined
				? { temperature: policy.temperature }
				: {}),
			...(policy.topP !== undefined ? { top_p: policy.topP } : {}),
			...(policy.frequencyPenalty !== undefined
				? { frequency_penalty: policy.frequencyPenalty }
				: {}),
			...(policy.presencePenalty !== undefined
				? { presence_penalty: policy.presencePenalty }
				: {}),
			...(policy.maxCompletionTokens !== undefined
				? { max_completion_tokens: policy.maxCompletionTokens }
				: {}),
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
