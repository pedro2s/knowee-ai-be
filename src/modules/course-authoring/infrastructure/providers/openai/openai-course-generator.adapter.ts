import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	CourseGeneratorPort,
	GenerateCourseInput,
} from 'src/modules/course-authoring/domain/ports/course-generator.port';
import { buildCoursePrompt } from './openai.prompts';
import OpenAI from 'openai';
import { courseStructure } from './schemas/course-structure.schema';
import { OPENAI_CLIENT } from 'src/shared/ai-providers/ai-providers.constants';
import { ChatModel } from 'openai/resources';
import { InteractionResult } from 'src/shared/types/interaction';
import { GeneratedCourse } from 'src/modules/course-authoring/domain/entities/course.types';
import { buildOpenAITextUsage } from 'src/shared/token-usage/infrastructure/ai-usage-metrics.factory';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private readonly logger = new Logger(OpenAICourseGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT)
		private readonly openai: OpenAI,
		private readonly llmExecutionPolicy: LLMExecutionPolicyService
	) {}

	async generate({
		courseDetails,
		filesAnalysis,
	}: GenerateCourseInput): Promise<InteractionResult<GeneratedCourse>> {
		this.logger.log(
			`Iniciando a geração do curso para o título: "${courseDetails.title}"`
		);

		const messages = buildCoursePrompt(courseDetails, filesAnalysis);

		this.logger.log('Enviando solicitação para a OpenAI...');
		const policy = this.llmExecutionPolicy.resolve(
			'course_authoring.generate_course',
			'openai'
		);
		const model = policy.model as ChatModel;
		if (policy.optimized) {
			this.logger.debug(
				`Usando policy otimizada para course_authoring.generate_course com modelo ${policy.model}`
			);
		}
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: courseStructure,
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

		const course = JSON.parse(content) as GeneratedCourse;

		const tokenUsage = buildOpenAITextUsage({
			model,
			operation: 'course_authoring.generate_course',
			modality: 'text',
			usage: completion.usage,
		});

		return {
			content: course,
			tokenUsage,
		};
	}
}
