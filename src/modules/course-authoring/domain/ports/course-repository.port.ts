import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { Course } from '../entities/course.entity';
import { CreateCourseInput, GeneratedCourse } from '../entities/course.types';

export abstract class CourseRepositoryPort {
	abstract create(course: Course, auth: AuthContext): Promise<Course>;
	abstract save(course: Course, auth: AuthContext): Promise<Course>;
	abstract findById(id: string, auth: AuthContext): Promise<Course | null>;
	abstract findAllByUserId(
		userId: string,
		auth: AuthContext
	): Promise<Course[]>;
	abstract update(
		id: string,
		values: Partial<CreateCourseInput>,
		auth: AuthContext
	): Promise<Course | null>;
	abstract delete(id: string, auth: AuthContext): Promise<void>;
	abstract saveCourseTree(
		course: GeneratedCourse,
		auth: AuthContext
	): Promise<Course>;
}
