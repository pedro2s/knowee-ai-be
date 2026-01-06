import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { Course } from '../../domain/entities/course.entity';
import type { InputFile } from '../../domain/entities/course.types';
import {
	FILE_PROCESSING_SERVICE,
	type FileProcessingPort,
} from 'src/shared/application/ports/file-processing.port';
import {
	EMBEDDING_SERVICE,
	type EmbeddingPort,
} from 'src/shared/application/ports/embedding.port';
import {
	TOKEN_USAGE_SERVICE,
	type TokenUsagePort,
} from 'src/shared/application/ports/token-usage.port';
import {
	HISTORY_SERVICE,
	type HistoryServicePort,
} from 'src/modules/history/application/ports/history-service.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';

@Injectable()
export class CreateCourseUseCase {
	private readonly logger = new Logger(CreateCourseUseCase.name);

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
		private readonly historyService: HistoryServicePort,
	) {}

	async execute(
		input: CreateCourseDto & {
			userId: string;
			files: Express.Multer.File[];
		},
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
				'Texto extraído. Usando o conteúdo do arquivo como contexto.',
			);
			// Use the extracted text directly as context for course generation
			filesAnalysis = extractedText;

			// Persist the knowledge for future use (e.g., chatbot), but don't use the query result for generation
			this.embeddingService.insertEmbedding(input.userId, extractedText);
			this.logger.log(
				'Embeddings dos arquivos foram salvos para referência futura.',
			);
		}

		const courseGen = this.providerRegistry.getCourseStrategy(
			input.ai?.provider || 'openai',
		);

		const {
			content: generatedCourse,
			history,
			tokenUsage,
		} = await courseGen.generate({
			courseDetails: input,
			filesAnalysis,
		});

		if (tokenUsage) {
			this.tokenUsageService.save(
				input.userId,
				tokenUsage.totalTokens,
				tokenUsage.model,
			);
		}

		const auth: AuthContext = {
			userId: input.userId,
			role: 'authenticated',
		};

		const savedCourse = await this.courseRepository.saveCourseTree(
			generatedCourse,
			auth,
		);

		for (const message of history) {
			await this.historyService.saveMessageAndSummarizeIfNecessary(
				auth,
				savedCourse.id,
				message.value.role as any,
				message.value.content,
			);
		}

		return savedCourse;
	}
}
