import { Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	GenerateArticleInput,
	GeneratedArticleOutput,
} from 'src/modules/course-authoring/domain/entities/generate-article.types';
import { ArticleGeneratorPort } from 'src/modules/course-authoring/domain/ports/article-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIArticleGeneratorAdapter implements ArticleGeneratorPort {
	private readonly logger = new Logger(OpenAIArticleGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async generate(
		context: InteractionContext<GenerateArticleInput>
	): Promise<InteractionResult<GeneratedArticleOutput>> {
		const { input } = context;

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

		messages.push({
			role: 'system',
			content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.

Com base no módulo e no contexto da aula, crie um artigo educativo completo e bem estruturado.
O artigo deve incluir: introdução envolvente, desenvolvimento com subtópicos organizados, exemplos práticos quando relevante, e uma conclusão que reforce os pontos principais.
Use formatação HTML simples (h1, h2, h3, p, ul, li, strong, em) para estruturar o conteúdo de forma clara e didática.
O artigo deve ser informativo, acessível e adequado para aprendizado online.
				
Certifique-se de:
Retornar o artigo completo pronto para ser editado em um componente WYSIWYG do React-Quill.
Não utilize nenhuma formatação de markdown.`,
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
			for (const history of context.recentHistory.slice(-3)) {
				const { role, content } = history.toPrimitives().message;
				messages.push({ role: role as any, content });
			}
		}

		// Adiciona a pergunta atual do usuário
		messages.push({
			role: 'user',
			content: `Titulo do módulo: ${input.moduleTitle}\nDescrição do módulo: ${input.moduleDescription}
			Título da aula: ${input.lessonTitle}\nDescrição da aula: ${input.lessonDescription}`,
		});

		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_article',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_article com modelo ${policy.model}`
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
			operation: 'course_authoring.generate_article',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: { content },
			tokenUsage,
		};
	}
}
