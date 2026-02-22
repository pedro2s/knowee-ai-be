import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { GenerateCourseDto } from '../dtos/generate-course.dto';
import { Course } from '../../domain/entities/course.entity';
import type { InputFile } from '../../domain/entities/course.types';
import {
	FILE_PROCESSING_SERVICE,
	type FileProcessingPort,
} from 'src/shared/storage/domain/ports/file-processing.port';
import {
	EMBEDDING_SERVICE,
	type EmbeddingPort,
} from 'src/shared/storage/domain/ports/embedding.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/token-usage/domain/ports/token-usage.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/shared/history/domain/ports/history-service.port';
import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';

@Injectable()
export class GenerateCourseUseCase {
	private readonly logger = new Logger(GenerateCourseUseCase.name);

	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		private readonly providerRegistry: ProviderRegistry,
		@Inject(FILE_PROCESSING_SERVICE)
		private readonly fileProcessingService: FileProcessingPort,
		@Inject(EMBEDDING_SERVICE)
		private readonly embeddingService: EmbeddingPort,
		@Inject(TOKEN_USAGE_SERVICE)
		private readonly tokenUsageService: TokenUsagePort,
		@Inject(HISTORY_SERVICE)
		private readonly historyService: HistoryServicePort
	) {}

	async execute(
		input: GenerateCourseDto & {
			userId: string;
			files: Express.Multer.File[];
		}
	): Promise<Course> {
		// Map Express files to domain InputFile to keep domain clean
		const domainFiles: InputFile[] = input.files.map((file) => ({
			originalname: file.originalname,
			buffer: file.buffer,
		}));

		const extractedText =
			await this.fileProcessingService.extractTextFromFiles(domainFiles);

		let filesAnalysis = '';
		if (extractedText) {
			this.logger.log(
				'Texto extraído. Usando o conteúdo do arquivo como contexto.'
			);
			// Use the extracted text directly as context for course generation
			filesAnalysis = extractedText;

			// Persist the knowledge for future use (e.g., chatbot), but don't use the query result for generation
			await this.embeddingService.insertEmbedding(input.userId, extractedText);
			this.logger.log(
				'Embeddings dos arquivos foram salvos para referência futura.'
			);
		}

		const courseGen = this.providerRegistry.getGenerateCourseStrategy(
			input.ai?.provider || 'openai'
		);

		const { content: generatedCourse, tokenUsage } = await courseGen.generate({
			courseDetails: input,
			filesAnalysis,
		});

		if (tokenUsage) {
			await this.tokenUsageService.save(
				input.userId,
				tokenUsage.totalTokens,
				tokenUsage.model
			);
		}

		const auth: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};

		const savedCourse = await this.courseRepository.saveCourseTree(
			generatedCourse,
			auth
		);

		// input stringify sem o files
		const userMessage = JSON.stringify({
			...input,
			files: 'omitted',
		});
		await this.historyService.saveMessage(
			auth,
			savedCourse.id,
			'user',
			userMessage
		);
		await this.historyService.saveMessage(
			auth,
			savedCourse.id,
			'assistant',
			JSON.stringify(generatedCourse)
		);

		return savedCourse;
	}
}
