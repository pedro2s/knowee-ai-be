import { Inject, Injectable, Logger } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { Course } from '../../domain/entities/course.entity';
import {
	HISTORY_REPOSITORY,
	type HistoryRepositoryPort,
} from 'src/modules/history/domain/ports/history-repository.port';
import { History } from 'src/modules/history/domain/entities/history.entity';
import type { InputFile } from '../../domain/entities/course.types';
import { FileProcessingService } from 'src/shared/file-processing/file-processing.service';
import { EmbeddingService } from 'src/shared/embeddings/embedding.service';

@Injectable()
export class CreateCourseUseCase {
	private readonly logger = new Logger(CreateCourseUseCase.name);

	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepositoryPort,
		private readonly providerRegistry: ProviderRegistry,
		private readonly fileProcessingService: FileProcessingService,
		private readonly embeddingService: EmbeddingService,
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
				'Texto extraído. Iniciando manipulação de embeddings...',
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

		console.log('Files analysis:', filesAnalysis);

		const courseGen = this.providerRegistry.getCourseStrategy(
			input.ai?.provider || 'openai',
		);

		console.log(input.preferredFormats);

		const { course: generatedCourse, history } = await courseGen.generate({
			courseDetails: input,
			filesAnalysis,
		});

		const savedCourse = await this.courseRepository.saveCourseTree(
			generatedCourse,
			{
				userId: input.userId,
				role: 'authenticated',
			},
		);

		for (const message of history) {
			const historyEntry = History.create({
				userId: input.userId,
				courseId: savedCourse.id,
				message,
			});
			await this.historyRepository.saveHistory(historyEntry, {
				userId: input.userId,
				role: 'authenticated',
			});
		}

		return savedCourse;
	}
}
