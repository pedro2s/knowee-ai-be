import { Inject, Injectable } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { Course } from '../../domain/entities/course.entity';

@Injectable()
export class CreateCourseUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
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

		const generated = await courseGen.generate(input);
		return this.courseRepository.saveCourseTree(generated, {
			userId: input.userId,
			role: 'authenticated',
		});
	}
}
