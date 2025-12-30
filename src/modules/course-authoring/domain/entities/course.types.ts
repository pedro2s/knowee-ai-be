import { CourseTitle } from '../value-objects/course-title.vo';
import { Module } from './module.entity';

/** O que a entidade PRECISA para existir */
export interface CourseProps {
	id: string;
	userId: string;
	title: CourseTitle;
	description: string | null;
	category: string | null;
	level: string | null;
	duration: string | null;
	targetAudience: string | null;
	objectives: string | null;
	files: unknown;
	createdAt: Date;
	updatedAt: Date;

	modules?: Module[];
}

/** Arquivo de input para geração de curso */
export interface InputFile {
	originalname: string;
	buffer: Buffer;
}

/** O que é necessário para a geração de um curso */
export interface CreateCourseInput {
	userId: string;
	files: InputFile[];

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
	preferredFormats?: string;

	// Dados de IA
	ai?: {
		provider?: string;
		model?: string;
	};
}

export interface GeneratedLesson {
	title: string;
	description: string;
	lesson_type: string;
	order_index: number;
	content: Record<string, unknown>;
}

export interface GeneratedModule {
	title: string;
	description: string;
	order_index: number;
	lessons: GeneratedLesson[];
}

export interface GeneratedCourse {
	title: string;
	description: string;
	category: string;
	level: string;
	duration: string;
	target_audience: string;
	objectives: string;
	modules: GeneratedModule[];
}

export interface CourseGenerationResult {
	course: GeneratedCourse;
	history: any[]; // O ideal é usar o tipo do OpenAI, mas `any` evita dependência de infra no domínio
}
