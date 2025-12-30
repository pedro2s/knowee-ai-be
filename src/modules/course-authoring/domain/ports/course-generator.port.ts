import {
	CreateCourseInput,
	type CourseGenerationResult,
} from '../entities/course.types';

export const COURSE_GENERATOR = 'CourseGenerator';

export interface CourseGeneratorPort {
	generate(input: CreateCourseInput): Promise<CourseGenerationResult>;
}
