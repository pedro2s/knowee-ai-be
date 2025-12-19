import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { Course } from '../entities/course.entity';
import { CreateCourseInput, GeneratedCourse } from '../entities/course.types';

export const COURSE_REPOSITORY = 'CourseRepository';
export interface CourseRepositoryPort {
	create(course: Course, auth: AuthContext): Promise<Course>;
	save(course: Course, auth: AuthContext): Promise<Course>;
	findById(id: string, auth: AuthContext): Promise<Course | null>;
	findAllByUserId(userId: string): Promise<Course[]>;
	update(
		id: string,
		course: Partial<CreateCourseInput>,
		auth: AuthContext,
	): Promise<Course | null>;
	delete(id: string, auth: AuthContext): Promise<void>;
	saveCourseTree(course: GeneratedCourse, userId: string): Promise<void>;
}
