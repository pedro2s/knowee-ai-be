import { GeneratedCourse } from '../entities/course.entity';

export const COURSE_REPOSITORY = 'CourseRepository';
export interface CourseRepositoryPort {
	saveCourseTree(course: GeneratedCourse, userId: string): Promise<void>;
}
