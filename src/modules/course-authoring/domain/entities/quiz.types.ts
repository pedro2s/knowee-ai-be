export interface GenerateQuizInput {
	module: {
		id: string;
		courseId: string;
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
	};
}

export interface GeneratedQuizQuestion {
	id?: string;
	question: string;
	options: string[];
	correctAnswer: number;
	explanation?: string;
}

export interface GeneratedQuiz {
	quizQuestions: GeneratedQuizQuestion[];
}
