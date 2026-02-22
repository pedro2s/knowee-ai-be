import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import { GenerateAssessmentsAgentPort } from '../../../domain/ports/generate-assessments-agent.port';
import {
	GenerateAssessmentsInput,
	GeneratedAssessments,
} from '../../../domain/entities/generated-assessments.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { assessmentsLessonsStructure } from './schemas/assessments-lessons-structure.schema';

@Injectable()
export class OpenAIGenerateAssessmentsAgentAdapter implements GenerateAssessmentsAgentPort {
	private readonly logger = new Logger(
		OpenAIGenerateAssessmentsAgentAdapter.name
	);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generateAssessments(
		context: InteractionContext<GenerateAssessmentsInput>
	): Promise<InteractionResult<GeneratedAssessments>> {
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
				context.input.course
			)}\n\nCrie sugestões de avaliações (quizzes, exercícios práticos, projetos) para este curso.

Para cada avaliação, retorne a estrutura de uma aula. Certifique-se de:
- Incluir títulos claros e objetivos claros nos títulos e descrição.
- Tipo de aula: quiz, pdf, external
- ID do Módulo válido para vincular a avaliação
- Ordenar para a última aula do módulo`,
		});

		this.logger.log(
			'Enviando solicitação para a OpenAI para gerar avaliações...'
		);
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: assessmentsLessonsStructure,
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

		let generatedAssessments: GeneratedAssessments;
		try {
			generatedAssessments = JSON.parse(content) as GeneratedAssessments;
		} catch {
			throw new PreconditionFailedException(
				'A API da OpenAI retornou conteúdo inválido para as avaliações.'
			);
		}

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: generatedAssessments,
			tokenUsage,
		};
	}
}
