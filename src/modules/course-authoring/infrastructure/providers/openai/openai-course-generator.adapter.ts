import { Inject, Injectable, Logger } from '@nestjs/common';
import { CourseGeneratorPort } from 'src/modules/course-authoring/domain/ports/course-generator.port';
import {
	CreateCourseInput,
	type CourseGenerationResult,
	type InputFile,
} from 'src/modules/course-authoring/domain/entities/course.types';
import { buildCoursePrompt, courseStructure } from './openai.prompts';
import OpenAI from 'openai';
import * as path from 'path';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { EmbeddingService } from 'src/shared/embeddings/embedding.service';
import { TokenUsageService } from 'src/shared/token-usage/token-usage.service';

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
		this.logger.log(`Starting course generation for title: "${input.title}"`);

		const extractedText = await this._extractTextFromFiles(input.files);

		let filesAnalysis = '';
		if (extractedText) {
			this.logger.log('Extracted text from files. Handling embeddings...');
			await this.embeddingService.insertEmbedding(
				input.userId,
				extractedText,
			);
			const contextDocs = await this.embeddingService.querySimilar(
				input.userId,
				input.title,
			);
			filesAnalysis = contextDocs.join('\n\n');
			this.logger.log('File analysis from similar documents is ready.');
		}

		const messages = buildCoursePrompt(input, filesAnalysis);

		this.logger.log('Sending request to OpenAI...');
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

		this.logger.log('Received response from OpenAI.');

		if (completion.usage?.total_tokens) {
			await this.tokenUsageService.save(
				input.userId,
				completion.usage.total_tokens,
				model,
			);
		}

		const content = completion.choices[0].message.content;
		if (!content) {
			this.logger.error('OpenAI API did not return any content.');
			throw new Error('OpenAI API did not return any content.');
		}

		messages.push(completion.choices[0].message);

		const course = JSON.parse(content);

		return { course, history: messages };
	}

	private async _extractTextFromFiles(files: InputFile[]): Promise<string> {
		if (!files || files.length === 0) {
			return '';
		}

		this.logger.log(`Extracting text from ${files.length} file(s)...`);
		const texts: string[] = [];

		for (const file of files) {
			const ext = path.extname(file.originalname).toLowerCase();
			const buffer = file.buffer;

			try {
				if (ext === '.pdf') {
					const data = await pdfParse(buffer);
					texts.push(data.text);
				} else if (ext === '.docx') {
					const { value } = await mammoth.extractRawText({ buffer });
					texts.push(value);
				} else if (ext === '.txt') {
					texts.push(buffer.toString('utf-8'));
				} else {
					this.logger.warn(`Unsupported file format: ${ext}. Skipping file.`);
				}
			} catch (error) {
				this.logger.error(
					`Error processing file ${file.originalname}:`,
					error,
				);
			}
		}

		return texts.join('\n\n');
	}
}
