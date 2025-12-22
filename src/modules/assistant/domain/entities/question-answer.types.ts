export interface QuestionAnswerProps {
	id: string;
	userId: string;
	courseId: string;
	question: string;
	answer: string;
	createdAt: Date;
}

export interface QuestionAnswerInput {
	userId: string;
	courseId: string;
	question: string;
	answer: string;
}

export interface QuestionAnswered {
	content: string;
}
