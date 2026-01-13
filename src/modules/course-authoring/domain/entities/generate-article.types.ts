export interface GenerateArticleInput {
	moduleTitle: string;
	moduleDescription: string;
	lessonTitle: string;
	lessonDescription: string;
}

export interface GeneratedArticleOutput {
	content: string;
}
