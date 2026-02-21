import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import { QuizGeneratorPort } from 'src/modules/course-authoring/domain/ports/quiz-generator.port';
import {
	GenerateQuizInput,
	GeneratedQuiz,
} from 'src/modules/course-authoring/domain/entities/quiz.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/infrastructure/ai/ai.constants';
import { quizContentStructure } from './schemas/quiz-content-structure.schema';

@Injectable()
export class OpenAIQuizGeneratorAdapter implements QuizGeneratorPort {
	private readonly logger = new Logger(OpenAIQuizGeneratorAdapter.name);

	constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

	async generateQuiz(
		context: InteractionContext<GenerateQuizInput>
	): Promise<InteractionResult<GeneratedQuiz>> {
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
			content: `Módulo: ${JSON.stringify(
				context.input.module
			)}\n\nCom base no módulo gere um quiz completo com 4 questões de múltipla escolha educativas e relevantes. Para cada questão, inclua: pergunta clara e específica, 4 opções de resposta bem elaboradas (sendo uma correta e três incorretas plausíveis), e uma explicação educativa da resposta correta.`,
		});

		this.logger.log(
			'Enviando solicitação para a OpenAI para geração de quiz...'
		);
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: quizContentStructure,
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

		let generatedQuiz: GeneratedQuiz;
		try {
			generatedQuiz = JSON.parse(content) as GeneratedQuiz;
		} catch {
			throw new PreconditionFailedException(
				'A API da OpenAI retornou conteúdo inválido para o quiz.'
			);
		}

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return {
			content: generatedQuiz,
			tokenUsage,
		};
	}
}
