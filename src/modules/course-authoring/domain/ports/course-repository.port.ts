import { AuthContext } from 'src/shared/application/ports/db-context.port';
import { Course } from '../entities/course.entity';
import { CreateCourseInput, GeneratedCourse } from '../entities/course.types';

export const COURSE_REPOSITORY = 'CourseRepository';
export interface CourseRepositoryPort {
	create(course: Course, auth: AuthContext): Promise<Course>;
	save(course: Course, auth: AuthContext): Promise<Course>;
	findById(id: string, auth: AuthContext): Promise<Course | null>;
	findAllByUserId(userId: string, auth: AuthContext): Promise<Course[]>;
	update(
		id: string,
		values: Partial<CreateCourseInput>,
		auth: AuthContext
	): Promise<Course | null>;
	delete(id: string, auth: AuthContext): Promise<void>;
	saveCourseTree(course: GeneratedCourse, auth: AuthContext): Promise<Course>;
}
