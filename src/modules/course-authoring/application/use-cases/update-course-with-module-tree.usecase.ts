import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { Course } from '../../domain/entities/course.entity';
import {
	COURSE_REPOSITORY,
	type CourseRepositoryPort,
} from '../../domain/ports/course-repository.port';
import { AuthContext } from 'src/shared/application/ports/db-context.port';
import {
	MODULE_REPOSITORY,
	type ModuleRepositoryPort,
} from '../../domain/ports/module-repository.port';
import {
	LESSON_REPOSITORY,
	type LessonRepositoryPort,
} from '../../domain/ports/lesson-repository.port';

@Injectable()
export class UpdateCourseWithModuleTreeUseCase {
	constructor(
		@Inject(COURSE_REPOSITORY)
		private readonly courseRepository: CourseRepositoryPort,
		@Inject(MODULE_REPOSITORY)
		private readonly moduleRepository: ModuleRepositoryPort,
		@Inject(LESSON_REPOSITORY)
		private readonly lessonRepository: LessonRepositoryPort
	) {}

	async execute(
		courseId: string,
		input: UpdateCourseDto,
		userId: string
	): Promise<Course> {
		const { modules, ...updateCourseData } = input;

		const authContext: AuthContext = { userId, role: 'authenticated' };

		await this.courseRepository.update(courseId, updateCourseData, authContext);

		if (modules?.length > 0) {
			for (const updateModuleData of modules) {
				await this.moduleRepository.update(
					updateModuleData.id,
					updateModuleData,
					authContext
				);
			}
		}

		const updatedCourse = await this.courseRepository.findById(
			courseId,
			authContext
		);

		if (!updatedCourse) throw new NotFoundException('Curso não encontrado');

		return updatedCourse;
	}
}
