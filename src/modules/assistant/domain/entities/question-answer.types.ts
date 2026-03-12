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

export interface QuestionAnsweredAction {
	status: 'none' | 'pending_confirmation' | 'executed' | 'cancelled' | 'failed';
	type?: string;
	pendingActionId?: string;
}

export interface QuestionAnswered {
	answer: string;
	action?: QuestionAnsweredAction;
}
