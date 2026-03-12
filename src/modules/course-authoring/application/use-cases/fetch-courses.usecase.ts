import { Injectable } from '@nestjs/common';
import { Course } from '../../domain/entities/course.entity';
import { CourseRepositoryPort } from '../../domain/ports/course-repository.port';

@Injectable()
export class FetchCoursesUseCase {
	constructor(private readonly courseRepository: CourseRepositoryPort) {}

	execute(userId: string): Promise<Course[]> {
		return this.courseRepository.findAllByUserId(userId, {
			userId,
			role: 'authenticated',
		});
	}
}
