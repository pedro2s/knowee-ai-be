import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	GenerateArticleInput,
	GeneratedArticleOutput,
} from 'src/modules/assistant/domain/entities/generate-article.types';
import { ArticleGeneratorPort } from 'src/modules/assistant/domain/ports/article-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';

@Injectable()
export class OpenAIArticleGeneratorAdapter implements ArticleGeneratorPort {
	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

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
			for (const history of context.recentHistory) {
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

		const model: ChatModel = 'gpt-4.1';

		const completion = await this.openai.chat.completions.create({
			model: model,
			messages: messages,
		});

		const content = completion.choices[0].message.content || '';

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: { content },
			tokenUsage,
		};
	}
}
