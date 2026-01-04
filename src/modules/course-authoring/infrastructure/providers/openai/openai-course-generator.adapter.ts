import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import {
	CourseGeneratorPort,
	GenerateCoursePortInput,
} from 'src/modules/course-authoring/domain/ports/course-generator.port';
import { type CourseGenerationResult } from 'src/modules/course-authoring/domain/entities/course.types';
import { buildCoursePrompt } from './openai.prompts';
import OpenAI from 'openai';
import { courseStructure } from './schemas/course-structure.schema';
import { OPENAI_CLIENT } from 'src/shared/ai/ai.constants';
import { ChatModel } from 'openai/resources';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private readonly logger = new Logger(OpenAICourseGeneratorAdapter.name);

	constructor(
		@Inject(OPENAI_CLIENT)
		private readonly openai: OpenAI,
	) {}

	async generate({
		courseDetails,
		filesAnalysis,
	}: GenerateCoursePortInput): Promise<CourseGenerationResult> {
		this.logger.log(
			`Iniciando a geração do curso para o título: "${courseDetails.title}"`,
		);

		const messages = buildCoursePrompt(courseDetails, filesAnalysis);

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model = courseDetails.ai?.model ?? ('gpt-4.1' as ChatModel);
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
				'A API da OpenAI não retornou nenhum conteúdo.',
			);
		}

		messages.push(completion.choices[0].message);

		const course = JSON.parse(content);

		const tokenUsage = completion.usage?.total_tokens
			? {
					totalTokens: completion.usage.total_tokens,
					model,
				}
			: undefined;

		return { course, history: messages, tokenUsage };
	}
}
