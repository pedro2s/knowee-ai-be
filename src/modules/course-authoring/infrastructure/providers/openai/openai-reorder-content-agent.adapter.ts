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
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { reorderContentStructure } from './schemas/reorder-content-structure.schema';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIReorderContentAgentAdapter implements ReorderContentAgentPort {
	private readonly logger = new Logger(OpenAIReorderContentAgentAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

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

		for (const history of context.recentHistory.slice(-2)) {
			const { role, content } = history.toPrimitives().message;
			messages.push({ role: role as any, content });
		}

		messages.push({
			role: 'user',
			content: `Curso: ${JSON.stringify(this.projectCourse(context.input))}\n\nAnalise a estrutura atual do curso e faça uma reordenação lógica dos módulos para melhor progressão de aprendizado.
Retorne apenas os módulos com id e orderIndex atualizado.`,
		});

		this.logger.log('Enviando solicitação para a OpenAI para reordenação...');
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.reorder_content',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.reorder_content com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: reorderContentStructure,
			...(policy.temperature !== undefined
				? { temperature: policy.temperature }
				: {}),
			...(policy.maxCompletionTokens !== undefined
				? { max_completion_tokens: policy.maxCompletionTokens }
				: {}),
			...(policy.topP !== undefined ? { top_p: policy.topP } : {}),
			...(policy.frequencyPenalty !== undefined
				? { frequency_penalty: policy.frequencyPenalty }
				: {}),
			...(policy.presencePenalty !== undefined
				? { presence_penalty: policy.presencePenalty }
				: {}),
		});

		const content = completion.choices[0].message.content;
		if (!content) {
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const reorderedContent = JSON.parse(content) as ReorderedContentResult;
		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'course_authoring.reorder_content',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: reorderedContent,
			tokenUsage,
		};
	}

	private projectCourse(course: CourseSummary) {
		return {
			id: course.id,
			title: course.title,
			description: course.description,
			modules: course.modules.map((module) => ({
				id: module.id,
				title: module.title,
				description: module.description,
				orderIndex: module.orderIndex,
				lessons: (module.lessons ?? []).map((lesson) => ({
					id: lesson.id,
					title: lesson.title,
					lessonType: lesson.lessonType,
					orderIndex: lesson.orderIndex,
				})),
			})),
		};
	}
}
