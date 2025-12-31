import {
	Inject,
	Injectable,
	Logger,
	PreconditionFailedException,
} from '@nestjs/common';
import { CourseGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-generator.port';
import {
	CreateCourseInput,
	type CourseGenerationResult,
	type InputFile,
} from 'src/modules/course-authoring/domain/entities/course.types';
import { buildCoursePrompt } from './openai.prompts';
import OpenAI from 'openai';
import * as path from 'path';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { EmbeddingService } from 'src/shared/embeddings/embedding.service';
import { TokenUsageService } from 'src/shared/token-usage/token-usage.service';
import { courseStructure } from './schemas/course-structure.schema';

@Injectable()
export class OpenAICourseGeneratorAdapter implements CourseGeneratorPort {
	private readonly openai: OpenAI;
	private readonly logger = new Logger(OpenAICourseGeneratorAdapter.name);

	constructor(
		@Inject(EmbeddingService)
		private readonly embeddingService: EmbeddingService,
		@Inject(TokenUsageService)
		private readonly tokenUsageService: TokenUsageService,
	) {
		this.openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});
	}

	async generate(input: CreateCourseInput): Promise<CourseGenerationResult> {
		this.logger.log(
			`Iniciando a geração do curso para o título: "${input.title}"`,
		);

		const extractedText = await this._extractTextFromFiles(input.files);

		let filesAnalysis = '';
		if (extractedText) {
			this.logger.log(
				'Extração de texto de arquivos. Manipulação de embeddings...',
			);
			await this.embeddingService.insertEmbedding(
				input.userId,
				extractedText,
			);
			const contextDocs = await this.embeddingService.querySimilar(
				input.userId,
				input.title,
			);
			filesAnalysis = contextDocs.join('\n\n');
			this.logger.log(
				'A análise de arquivos a partir de documentos semelhantes está pronta.',
			);
		}

		const messages = buildCoursePrompt(input, filesAnalysis);

		this.logger.log('Enviando solicitação para a OpenAI...');
		const model = input.ai?.model ?? 'gpt-4o';
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
				input.userId,
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

	private async _extractTextFromFiles(files: InputFile[]): Promise<string> {
		if (!files || files.length === 0) {
			return '';
		}

		this.logger.log(`Extraindo texto de ${files.length} arquivo(s)...`);
		const texts: string[] = [];

		for (const file of files) {
			const ext = path.extname(file.originalname).toLowerCase();
			const buffer = file.buffer;

			try {
				if (ext === '.pdf') {
					const parse = new PDFParse({ data: buffer });
					const data = await parse.getText();
					texts.push(data.text);
				} else if (ext === '.docx') {
					const { value } = await mammoth.extractRawText({ buffer });
					texts.push(value);
				} else if (ext === '.txt') {
					texts.push(buffer.toString('utf-8'));
				} else {
					this.logger.warn(
						`Formato de arquivo não suportado: ${ext}. Arquivo ignorado.`,
					);
				}
			} catch (error) {
				this.logger.error(
					`Erro ao processar o arquivo ${file.originalname}:`,
					error,
				);
			}
		}

		return texts.join('\n\n');
	}
}
