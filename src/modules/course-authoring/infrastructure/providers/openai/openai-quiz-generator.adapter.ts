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
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { quizContentStructure } from './schemas/quiz-content-structure.schema';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIQuizGeneratorAdapter implements QuizGeneratorPort {
	private readonly logger = new Logger(OpenAIQuizGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

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

		for (const history of context.recentHistory.slice(-2)) {
			const { role, content } = history.toPrimitives().message;
			messages.push({ role: role as any, content });
		}

		messages.push({
			role: 'user',
			content: `Módulo: ${JSON.stringify(this.projectModule(context.input.module))}\n\nCom base no módulo gere um quiz completo com 4 questões de múltipla escolha educativas e relevantes. Para cada questão, inclua: pergunta clara e específica, 4 opções de resposta bem elaboradas (sendo uma correta e três incorretas plausíveis), e uma explicação educativa da resposta correta.`,
		});

		this.logger.log(
			'Enviando solicitação para a OpenAI para geração de quiz...'
		);
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_quiz',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_quiz com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: quizContentStructure,
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

		let generatedQuiz: GeneratedQuiz;
		try {
			generatedQuiz = JSON.parse(content) as GeneratedQuiz;
		} catch {
			throw new PreconditionFailedException(
				'A API da OpenAI retornou conteúdo inválido para o quiz.'
			);
		}

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'course_authoring.generate_quiz',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: generatedQuiz,
			tokenUsage,
		};
	}

	private projectModule(module: GenerateQuizInput['module']) {
		return {
			id: module.id,
			courseId: module.courseId,
			title: module.title,
			description: module.description,
			orderIndex: module.orderIndex,
			lessons: module.lessons.map((lesson) => ({
				id: lesson.id,
				title: lesson.title,
				description: lesson.description,
				lessonType: lesson.lessonType,
				orderIndex: lesson.orderIndex,
			})),
		};
	}
}
