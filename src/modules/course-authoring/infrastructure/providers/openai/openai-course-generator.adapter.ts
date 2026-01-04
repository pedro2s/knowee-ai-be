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
import { TokenUsageService } from 'src/shared/token-usage/token-usage.service';
import { courseStructure } from './schemas/course-structure.schema';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private readonly openai: OpenAI;
	private readonly logger = new Logger(OpenAICourseGeneratorAdapter.name);

	constructor(
		@Inject(TokenUsageService)
		private readonly tokenUsageService: TokenUsageService,
	) {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	async generate({
		courseDetails,
		filesAnalysis,
	}: GenerateCoursePortInput): Promise<CourseGenerationResult> {
		this.logger.log(
			`Iniciando a geração do curso para o título: "${courseDetails.title}"`,
		);

		const messages = buildCoursePrompt(courseDetails, filesAnalysis);

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model = courseDetails.ai?.model ?? 'gpt-4o';
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

		if (completion.usage?.total_tokens) {
			await this.tokenUsageService.save(
				courseDetails.userId,
				completion.usage.total_tokens,
				model,
			);
		}

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('A API da OpenAI não retornou nenhum conteúdo.');
			throw new PreconditionFailedException(
				'A API da OpenAI não retornou nenhum conteúdo.',
			);
		}

		messages.push(completion.choices[0].message);

		const course = JSON.parse(content);

		return { course, history: messages };
	}
}
