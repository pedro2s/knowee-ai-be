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

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private readonly logger = new Logger(OpenAICourseGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT)
		private readonly openai: OpenAI
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
		const model: ChatModel = 'gpt-4.1';
		const completion = await this.openai.chat.completions.create({
			model,
			messages,
			response_format: courseStructure,
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
