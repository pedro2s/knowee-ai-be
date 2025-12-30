import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class CreateCourseUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepository: HistoryRepositoryPort,
		private readonly providerRegistry: ProviderRegistry,
	) {}

	async execute(
		input: CreateCourseDto & {
			userId: string;
			files: Express.Multer.File[];
		},
	): Promise<Course> {
		const courseGen = this.providerRegistry.getCourseStrategy(
			input.ai?.provider || 'openai',
		);

		// Map Express files to domain InputFile to keep domain clean
		const domainFiles: InputFile[] = input.files.map((file) => ({
			originalname: file.originalname,
			buffer: file.buffer,
		}));

		const { course: generatedCourse, history } = await courseGen.generate({
			...input,
			files: domainFiles,
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
