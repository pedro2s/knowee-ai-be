import { AuthContext } from 'src/shared/database/domain/ports/db-context.port';
import { QuestionAnswer } from '../entities/question-answer.entity';

export abstract class QuestionAnswerRepositoryPort {
	abstract create(
		questionAnswer: QuestionAnswer,
		auth: AuthContext
	): Promise<QuestionAnswer>;
	abstract findAllByCourseId(
		courseId: string,
		auth: AuthContext
	): Promise<QuestionAnswer[]>;
}
