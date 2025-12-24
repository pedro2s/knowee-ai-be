import { Inject, Injectable } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { CreateCourseInput } from '../../domain/entities/course.types';
import { ProviderRegistry } from '../../infrastructure/providers/provider.registry';

@Injectable()
export class CreateCourseUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		private readonly providerRegistry: ProviderRegistry,
	) {}

	async execute(input: CreateCourseInput) {
		const courseGen = this.providerRegistry.getCourseStrategy(
			input.model || 'openai',
		);
		const generated = await courseGen.generate(input);
		return this.courseRepository.saveCourseTree(generated, {
			userId: input.userId,
			role: 'authenticated',
		});
	}
}
