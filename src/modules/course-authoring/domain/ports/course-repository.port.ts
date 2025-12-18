import {
	Course,
	CreateCouseInput,
	GeneratedCourse,
} from '../entities/course.entity';

export const COURSE_REPOSITORY = 'CourseRepository';
export interface CourseRepositoryPort {
	create(course: CreateCouseInput): Promise<Course>;
	findById(id: string): Promise<Course | null>;
	findAllByUserId(userId: string): Promise<Course[]>;
	update(id: string, course: Partial<CreateCouseInput>): Promise<Course | null>;
	delete(id: string): Promise<void>;
	saveCourseTree(course: GeneratedCourse, userId: string): Promise<void>;
}
