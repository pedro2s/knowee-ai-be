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

	execute(userId: string): Promise<Course[]> {
		return this.courseRepository.findAllByUserId(userId);
	}
}
