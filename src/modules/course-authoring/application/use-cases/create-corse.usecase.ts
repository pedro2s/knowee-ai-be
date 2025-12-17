import { Inject, Injectable } from '@nestjs/common';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { CreateCouseInput } from '../../domain/entities/course.entity';
import { ProviderRegistry } from 'src/modules/ai/infrasctructure/providers/provider.registry';

@Injectable()
export class CreateCourseUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		private readonly providerRegistry: ProviderRegistry,
	) {}

	async execute(input: CreateCouseInput) {
		const courseGen = this.providerRegistry.getCourseStrategy(
			input.provider || 'openai',
		);
		const generated = await courseGen.generate(input);
		return this.courseRepository.saveCourseTree(generated, input.userId);
	}
}
