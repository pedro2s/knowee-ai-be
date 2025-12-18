import { Inject, Injectable } from '@nestjs/common';
import { Course } from '../../domain/entities/course.entity';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';

@Injectable()
export class FetchCoursesUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
	) {}

	async execute(userId: string): Promise<Course[]> {
		console.log('userId:', userId);
		const courses = await this.courseRepository.findAllByUserId(userId);
		return courses;
	}
}
