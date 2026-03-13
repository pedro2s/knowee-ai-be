import { Injectable, NotFoundException } from '@nestjs/common';
import { Course } from '../../domain/entities/course.entity';
import { CourseRepositoryPort } from '../../domain/ports/course-repository.port';

@Injectable()
export class GetCourseUseCase {
	constructor(private readonly courseRepository: CourseRepositoryPort) {}

	async execute({
		id,
		userId,
	}: {
		id: string;
		userId: string;
	}): Promise<Course> {
		const course = await this.courseRepository.findById(id, {
			userId,
			role: 'authenticated',
		});

		if (!course) throw new NotFoundException('Curso não encontrado');

		return course;
	}
}
