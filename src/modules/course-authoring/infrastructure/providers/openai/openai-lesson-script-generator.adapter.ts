import { Inject, Logger, PreconditionFailedException } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import {
	GeneratedLessonScript,
	GenerateLessonScriptInput,
	ScriptSection,
} from 'src/modules/course-authoring/domain/entities/lesson-script.types';
import { LessonScriptGeneratorPort } from 'src/modules/course-authoring/domain/ports/lesson-script-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { scriptSectionsStructure } from './schemas/scription-sections-structure.schema';

export class OpenAILessonScriptGeneratorAdapter implements LessonScriptGeneratorPort {
	private readonly logger = new Logger(OpenAILessonScriptGeneratorAdapter.name);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generate(
		context: InteractionContext<GenerateLessonScriptInput>
	): Promise<InteractionResult<GeneratedLessonScript>> {
		this.logger.log('Iniciando a geração do script da aula...');

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Você é um especialista em design instrucional e um roteirista sênior para cursos online, com vasta experiência em criar conteúdo didático e engajador.

Sua tarefa é criar um roteiro completo e bem estruturado para uma aula online, com base nas informações fornecidas.`,
			},
		];

		if (context.summary) {
			messages.push({
				role: 'system',
				content: `Aqui está um resumo da conversa até agora:\n${context.summary}`,
			});
		}

		if (context.recentHistory) {
			for (const history of context.recentHistory) {
				const { role, content } = history.toPrimitives().message;
				messages.push({ role: role as any, content });
			}
		}

		const { title, description } = context.input;

		messages.push({
			role: 'user',
			content: [
				{
					type: 'text',
					text: `Contexto da Aula:
- Título: "${title}"
- Descrição: "${description}"
- Público-alvo: "Adapte a linguagem ao nível do público-alvo do curso."
- Tom desejado: "Adapte o tom de voz baseado no perfil do instrutor e no público-alvo."`,
				},
				{
					type: 'text',
					text: `Instruções:
1. Estrutura Lógica: Divida o conteúdo da aula em seções lógicas e sequenciais. Pense em cada seção como um bloco de gravação independente (ex: Introdução, Conceito Chave 1, Exemplo Prático, Conclusão).
2. Conteúdo do Roteiro: Para cada seção, escreva o texto do roteiro em formato Markdown. O texto deve ser:
    - Conversacional: Escrito como se o instrutor estivesse falando diretamente com o aluno.
    - Didático: Claro, objetivo e fácil de entender.
    - Engajador: Use perguntas, pausas e destaques (negrito, itálico) para manter o interesse.
3. Formato de Saída OBRIGATÓRIO: Sua resposta final deve ser exclusivamente um objeto JSON válido, sem nenhum texto ou explicação adicional antes ou depois.`,
				},
				{
					type: 'text',
					text: `Exemplo de uma seção de roteiro no campo "content":

"Olá e seja muito bem-vindo(a) à nossa aula sobre **Design Patterns**! \n\nNesta primeira parte, vamos entender *o que são* e *por que* eles são tão importantes no desenvolvimento de software. Preparado(a)? Então vamos começar!"

Agora, gere o roteiro completo para a aula descrita.`,
				},
			],
		});

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: scriptSectionsStructure,
			temperature: 1,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
		});

		this.logger.log('Resposta recebida da OpenAI.');

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('A API da OpenAI não retornou nenhum conteúdo.');
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const generatedLessonScript = JSON.parse(content) as GeneratedLessonScript;

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: generatedLessonScript,
			tokenUsage,
		};
	}
}
