import { Inject, Injectable } from '@nestjs/common';
import type { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import { CreateCouseInput } from '../../domain/entities/course.entity';
import { ProviderRegistry } from 'src/modules/ai/infrasctructure/providers/provider.registry';
import { DrizzleCourseRepository } from '../../infrastructure/persistence/drizzle/repositories/drizzle-course.repository';

@Injectable()
export class CreateCourseUseCase {
	constructor(
		private readonly providerRegistry: ProviderRegistry,
		@Inject(DrizzleCourseRepository)
		private readonly repo: CourseRepositoryPort,
	) {}

	async execute(input: CreateCouseInput) {
		const courseGen = this.providerRegistry.getCourseStrategy(
			input.provider || 'openai',
		);
		const generated = await courseGen.generate(input);
		return this.repo.saveCourseTree(generated, input.userId);
	}
}
