import { AuthContext } from 'src/shared/database/application/ports/db-context.port';
import { QuestionAnswer } from '../entities/question-answer.entity';

export const QUESTION_ANSWER_REPOSITORY = 'QUESTION_ANSWER_REPOSITORY';

export interface QuestionAnswerRepositoryPort {
	create(
		questionAnswer: QuestionAnswer,
		auth: AuthContext,
	): Promise<QuestionAnswer>;
	findAllByCourseId(
		courseId: string,
		auth: AuthContext,
	): Promise<QuestionAnswer[]>;
}
