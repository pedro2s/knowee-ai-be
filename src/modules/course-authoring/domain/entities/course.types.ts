/** O que a entidade PRECISA para existir */
export interface CourseProps {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	category: string | null;
	level: string | null;
	duration: string | null;
	targetAudience: string | null;
	objectives: string | null;
	files: unknown;
	createdAt: Date;
	updatedAt: Date;
}

/** O que é necessário para criar um NOVO curso (sem ID, datas automáticas, etc) */
export interface CreateCourseInput {
	userId: string;
	title: string;
	description?: string;
	category?: string;
	level?: string;
	duration?: string;
	targetAudience?: string;
	objectives?: string;
	files: unknown;
	model?: string;
}

export interface GeneratedCourse {
	course: {
		title: string;
		description: string;
		category: string;
		level: string;
		duration: string;
		targetAudience: string;
	};
	lessons: Array<{
		title: string;
		content: string;
		order: number;
	}>;
}
