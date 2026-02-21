import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	CourseSummary,
	ReorderContentAgentPort,
	ReorderedContentResult,
} from 'src/modules/course-authoring/domain/ports/reorder-content-agent.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { reorderContentStructure } from './schemas/reorder-content-structure.schema';

@Injectable()
export class OpenAIReorderContentAgentAdapter implements ReorderContentAgentPort {
	private readonly logger = new Logger(OpenAIReorderContentAgentAdapter.name);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async reorderContent(
		context: InteractionContext<CourseSummary>
	): Promise<InteractionResult<ReorderedContentResult>> {
		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content:
					'Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.',
			},
		];

		if (context.summary) {
			messages.push({
				role: 'system',
				content: `Aqui está um resumo da conversa até agora:\n${context.summary}`,
			});
		}

		for (const history of context.recentHistory) {
			const { role, content } = history.toPrimitives().message;
			messages.push({ role: role as any, content });
		}

		messages.push({
			role: 'user',
			content: `Curso: ${JSON.stringify(
				context.input
			)}\n\nAnalise a estrutura atual do curso e faça uma reordenação lógica dos módulos para melhor progressão de aprendizado.
Retorne apenas os módulos com id e orderIndex atualizado.`,
		});

		this.logger.log('Enviando solicitação para a OpenAI para reordenação...');
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: reorderContentStructure,
			temperature: 1,
			max_completion_tokens: 2048,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
		});

		const content = completion.choices[0].message.content;
		if (!content) {
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const reorderedContent = JSON.parse(content) as ReorderedContentResult;
		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: reorderedContent,
			tokenUsage,
		};
	}
}
