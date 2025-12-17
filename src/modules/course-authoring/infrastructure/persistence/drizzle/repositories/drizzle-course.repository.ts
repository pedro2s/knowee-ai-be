import { GeneratedCourse } from 'src/modules/course-authoring/domain/entities/course.entity';
import { CourseRepositoryPort } from 'src/modules/course-authoring/domain/ports/course-repository.port';

export class DrizzleCourseRepository implements CourseRepositoryPort {
	saveCourseTree(course: GeneratedCourse, userId: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
}
