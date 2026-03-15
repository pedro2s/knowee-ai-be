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
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAIGenerateAssessmentsAgentAdapter implements GenerateAssessmentsAgentPort {
	private readonly logger = new Logger(
		OpenAIGenerateAssessmentsAgentAdapter.name
	);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

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

		for (const history of context.recentHistory.slice(-2)) {
			const { role, content } = history.toPrimitives().message;
			messages.push({ role: role as any, content });
		}

		messages.push({
			role: 'user',
			content: `Curso: ${JSON.stringify(this.projectCourse(context.input.course))}\n\nCrie sugestões de avaliações (quizzes, exercícios práticos, projetos) para este curso.

Para cada avaliação, retorne a estrutura de uma aula. Certifique-se de:
- Incluir títulos claros e objetivos claros nos títulos e descrição.
- Tipo de aula: quiz, pdf, external
- ID do Módulo válido para vincular a avaliação
- Ordenar para a última aula do módulo`,
		});

		this.logger.log(
			'Enviando solicitação para a OpenAI para gerar avaliações...'
		);
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_assessments',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_assessments com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: assessmentsLessonsStructure,
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

		let generatedAssessments: GeneratedAssessments;
		try {
			generatedAssessments = JSON.parse(content) as GeneratedAssessments;
		} catch {
			throw new PreconditionFailedException(
				'A API da OpenAI retornou conteúdo inválido para as avaliações.'
			);
		}

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'course_authoring.generate_assessments',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: generatedAssessments,
			tokenUsage,
		};
	}

	private projectCourse(course: GenerateAssessmentsInput['course']) {
		return {
			id: course.id,
			title: course.title,
			description: course.description,
			category: course.category,
			level: course.level,
			duration: course.duration,
			targetAudience: course.targetAudience,
			objectives: course.objectives,
			modules: course.modules.map((module) => ({
				id: module.id,
				title: module.title,
				description: module.description,
				orderIndex: module.orderIndex,
				lessons: module.lessons.map((lesson) => ({
					id: lesson.id,
					title: lesson.title,
					lessonType: lesson.lessonType,
					orderIndex: lesson.orderIndex,
				})),
			})),
		};
	}
}
