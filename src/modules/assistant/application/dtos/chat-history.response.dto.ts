import { QuestionAnswer } from '../../domain/entities/question-answer.entity';

export class ChatHistoryResponseDto {
	id: string;
	userId: string;
	courseId: string;
	question: string;
	answer: string;
	createdAt: string;

	constructor(props: ChatHistoryResponseDto) {
		Object.assign(this, props);
	}

	static fromDomain(entity: QuestionAnswer): ChatHistoryResponseDto {
		const primitives = entity.toPrimitives();
		return new ChatHistoryResponseDto({
			id: primitives.id,
			userId: primitives.userId,
			courseId: primitives.courseId,
			question: primitives.question,
			answer: primitives.answer,
			createdAt: primitives.createdAt.toISOString(),
		});
	}
}
