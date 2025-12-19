/** O que a entidade PRECISA para existir */
export interface ModuleProps {
	id: string;
	courseId: string;
	title: string;
	description: string | null;
	orderIndex: number;
	createdAt: Date;
	updatedAt: Date;
}

/** O que é necessário para criar um NOVO módulo (sem ID, datas automáticas, etc) */
export interface CreateModuleInput {
	courseId: string;
	title: string;
	description?: string;
	orderIndex: number;
}
