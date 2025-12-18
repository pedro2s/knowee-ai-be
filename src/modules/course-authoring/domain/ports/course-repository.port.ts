import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import {
	Course,
	CreateCouseInput,
	GeneratedCourse,
} from '../entities/course.entity';

export const COURSE_REPOSITORY = 'CourseRepository';
export interface CourseRepositoryPort {
	create(course: CreateCouseInput, auth: AuthContext): Promise<Course>;
	findById(id: string, auth: AuthContext): Promise<Course | null>;
	findAllByUserId(userId: string): Promise<Course[]>;
	update(
		id: string,
		course: Partial<CreateCouseInput>,
		auth: AuthContext,
	): Promise<Course | null>;
	delete(id: string, auth: AuthContext): Promise<void>;
	saveCourseTree(course: GeneratedCourse, userId: string): Promise<void>;
}
