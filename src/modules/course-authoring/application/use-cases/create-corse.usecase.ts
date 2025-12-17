import { Injectable } from '@nestjs/common';
import { CourseAIGeneratorPort } from 'src/course-authoring/domain/course/ports/course-ai-generator.port';
import { CourseRepositoryPort } from 'src/course-authoring/domain/course/ports/course-repository.port';

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
