/** O que a entidade PRECISA para existir */
export interface LessonProps {
	id: string;
	moduleId: string;
	courseId: string;
	title: string;
	description: string | null;
	lessonType: string;
	content: unknown;
	assets: unknown;
	orderIndex: number;
	duration: number | null;
	isPublished: boolean | null;
	createdAt: Date;
	updatedAt: Date;
}

/** O que é necessário para criar uma NOVA aula (sem ID, datas automáticas, etc) */
export interface CreateLessonInput {
	moduleId: string;
	courseId: string;
	title: string;
	description?: string;
	lessonType: string;
	content?: unknown;
	assets?: unknown;
	orderIndex: number;
	duration?: number;
	isPublished?: boolean;
}
