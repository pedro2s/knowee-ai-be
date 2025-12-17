import { Injectable } from '@nestjs/common';
import type { CourseAIGeneratorPort } from '../../domain/ports/course-ai-generator.port';
import type { CourseRepositoryPort } from '../../domain/ports/course-repository.port';
import { CreateCouseInput } from '../../domain/entities/course.entity';

@Injectable()
export class CreateCourseUseCase {
	constructor(
		private readonly ai: CourseAIGeneratorPort,
		private readonly repo: CourseRepositoryPort,
	) {}

	async execute(input: CreateCouseInput) {
		const generated = await this.ai.generate(input);
		return this.repo.saveCourseTree(generated, input.userId);
	}
}
