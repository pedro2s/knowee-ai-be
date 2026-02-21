export interface GenerateAssessmentsInput {
	course: {
		id: string;
		title: string;
		description: string | null;
		category: string | null;
		level: string | null;
		duration: string | null;
		targetAudience: string | null;
		objectives: string | null;
		modules: Array<{
			id: string;
			title: string;
			description: string | null;
			orderIndex: number;
			lessons: Array<{
				id: string;
				title: string;
				description: string | null;
				lessonType: string;
				orderIndex: number;
			}>;
		}>;
	};
}

export interface GeneratedAssessmentLesson {
	title: string;
	description: string;
	orderIndex: number;
	moduleId: string;
	lessonType: 'quiz' | 'pdf' | 'external';
}

export interface GeneratedAssessments {
	lessons: GeneratedAssessmentLesson[];
}
