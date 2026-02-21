import { GeneratedCourse } from '../entities/course.types';
import { InteractionResult } from 'src/shared/types/interaction';

export const COURSE_GENERATOR = 'CourseGenerator';

export interface CourseDetails {
	// Dados básicos do curso
	title: string;
	description?: string;
	category?: string;
	level?: string;
	duration?: string;
	targetAudience?: string;

	// perfil do instrutor
	instructorName?: string;
}
export interface GenerateCourseInput {
	courseDetails: CourseDetails;
	filesAnalysis: string;
}

export interface CourseGeneratorPort {
	generate(
		input: GenerateCourseInput
	): Promise<InteractionResult<GeneratedCourse>>;
}
