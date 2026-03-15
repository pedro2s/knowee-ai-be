import { Inject, Logger, PreconditionFailedException } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatModel } from 'openai/resources';
import { GeneratedModule } from 'src/modules/course-authoring/domain/entities/course.types';
import {
	GenerateModuleInput,
	ModuleGeneratorPort,
} from 'src/modules/course-authoring/domain/ports/module-generator.port';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { moduleStructure } from './schemas/module-structure.schema';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

export class OpenAIModuleGeneratorAdapter implements ModuleGeneratorPort {
	private readonly logger = new Logger(OpenAIModuleGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async generate(
		context: InteractionContext<GenerateModuleInput>
	): Promise<InteractionResult<GeneratedModule>> {
		this.logger.log('Iniciando a geração do módulo...');

		const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{
				role: 'system',
				content: `Como assistente especializado em criação de cursos educacionais, responda de forma útil e específica para ajudar a melhorar este curso.`,
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

		messages.push({
			role: 'user',
			content: `Estrutura atual do curso: ${JSON.stringify(
				this.projectCourseStructure(context.input.currentCourseStructure)
			)}

			Com base na estrutura atual do curso, gere um módulo completo e de relevância para o curso.
			Certifique-se de:
			- Adaptar a quantidade de aulas conforme o contexto do curso.
			- Incluir nomes realistas e objetivos claros nos títulos e descrições.`,
		});

		this.logger.log('Enviando solicitação para a OpenAI...');
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_module',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_module com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: moduleStructure,
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

		this.logger.log('Resposta recebida da OpenAI.');

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('A API da OpenAI não retornou nenhum conteúdo.');
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.'
			);
		}

		const module = JSON.parse(content) as GeneratedModule;

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'course_authoring.generate_module',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: module,
			tokenUsage,
		};
	}

	private projectCourseStructure(
		currentCourseStructure: GenerateModuleInput['currentCourseStructure']
	) {
		return {
			title: currentCourseStructure.title,
			description: currentCourseStructure.description,
			modules: (currentCourseStructure.modules ?? []).map((module) => ({
				title: module.title,
				description: module.description,
				orderIndex: module.orderIndex,
				lessons: (module.lessons ?? []).map((lesson) => ({
					title: lesson.title,
					lessonType: lesson.lessonType,
					orderIndex: lesson.orderIndex,
				})),
			})),
		};
	}
}
