import { InteractionResult } from 'src/shared/domain/types/interaction-result';
import { CreateCourseInput, GeneratedCourse } from '../entities/course.types';

export const COURSE_GENERATOR = 'CourseGenerator';

export interface GenerateCoursePortInput {
	courseDetails: CreateCourseInput;
	filesAnalysis: string;
}

export interface CourseGeneratorPort {
	generate(
		input: GenerateCoursePortInput,
	): Promise<InteractionResult<GeneratedCourse>>;
}
