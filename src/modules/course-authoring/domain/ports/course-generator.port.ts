import {
	CreateCourseInput,
	type CourseGenerationResult,
} from '../entities/course.types';

export const COURSE_GENERATOR = 'CourseGenerator';

export interface GenerateCoursePortInput {
	courseDetails: CreateCourseInput;
	filesAnalysis: string;
}

export interface CourseGeneratorPort {
	generate(input: GenerateCoursePortInput): Promise<CourseGenerationResult>;
}
