import { CreateCourseInput, GeneratedCourse } from '../entities/course.types';

export interface CourseGeneratorPort {
	generate(input: CreateCourseInput): Promise<GeneratedCourse>;
}
