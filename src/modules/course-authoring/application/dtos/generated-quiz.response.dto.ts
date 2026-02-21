import { GeneratedQuiz } from '../../domain/entities/quiz.types';

export class GeneratedQuizResponseDto {
	quizQuestions: Array<{
		id: string;
		question: string;
		options: string[];
		correctAnswer: number;
		explanation?: string;
	}>;

	private constructor(props: GeneratedQuizResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(generatedQuiz: GeneratedQuiz): GeneratedQuizResponseDto {
		return new GeneratedQuizResponseDto({
			quizQuestions: generatedQuiz.quizQuestions.map((question) => ({
				id: question.id || crypto.randomUUID(),
				question: question.question,
				options: question.options,
				correctAnswer: question.correctAnswer,
				explanation: question.explanation,
			})),
		});
	}
}
