import { QuestionAnswer } from 'src/modules/assistant/domain/entities/question-answer.entity';
import { SelectQuestionAnswer } from 'src/shared/infrastructure/database/drizzle/schema';

export class QuestionAnswerMapper {
	static toDomain(raw: SelectQuestionAnswer): QuestionAnswer {
		return QuestionAnswer.restore({
			id: raw.id,
			userId: raw.userId,
			courseId: raw.courseId,
			question: raw.question,
			answer: raw.answer,
			createdAt: new Date(raw.createdAt),
		});
	}

	static toPersistence(entity: QuestionAnswer): SelectQuestionAnswer {
		const props = entity.toPrimitives();

		return {
			id: props.id,
			userId: props.userId,
			courseId: props.courseId,
			question: props.question,
			answer: props.answer,
			createdAt: props.createdAt.toISOString(),
		};
	}
}
