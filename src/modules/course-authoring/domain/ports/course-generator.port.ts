import { InteractionResult } from 'src/shared/domain/types/interaction-result';
import { GeneratedCourse } from '../entities/course.types';

export const COURSE_GENERATOR = 'CourseGenerator';

export interface CourseDetails {
	// Dados básicos do curso
	title: string;
	description?: string;
	category?: string;
	level?: string;
	duration?: string;
	targetAudience?: string;
	objectives?: string;

	// Dados personalizados baseados no nível
	mainGoal?: string;
	essentialTopics?: string;
	examplesCases?: string;
	courseType?: string;
	includeAssessments: boolean;
	includeProjects: boolean;

	// perfil do instrutor
	instructorName: string;
	instructorLevel?: string;
	instructorArea?: string;
	teachingExperience?: string;
	instructorAchievements?: string;
	typicalAudience?: string;
	instructorMotivation?: string;
	preferredFormats?: string[];
}
export interface GenerateCourseInput {
	courseDetails: CourseDetails;
	filesAnalysis: string;
}

export interface CourseGeneratorPort {
	generate(
		input: GenerateCourseInput,
	): Promise<InteractionResult<GeneratedCourse>>;
}
