export interface GenerateArticleInput {
	courseId: string;
	moduleId: string;
	title: string;
	description: string;
}

export interface GeneratedArticleOutput {
	content: string;
}
