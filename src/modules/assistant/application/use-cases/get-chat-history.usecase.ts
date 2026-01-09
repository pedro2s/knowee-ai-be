import { Inject, Injectable } from '@nestjs/common';
import { QuestionAnswer } from '../../domain/entities/question-answer.entity';
import {
	QUESTION_ANSWER_REPOSITORY,
	type QuestionAnswerRepositoryPort,
} from '../../domain/ports/question-anwer-repository.port';

@Injectable()
export class GetChatHistoryUseCase {
	constructor(
		@Inject(QUESTION_ANSWER_REPOSITORY)
		private readonly questionAnswerRepository: QuestionAnswerRepositoryPort
	) {}

	execute({
		courseId,
		userId,
	}: {
		courseId: string;
		userId: string;
	}): Promise<QuestionAnswer[]> {
		return this.questionAnswerRepository.findAllByCourseId(courseId, {
			userId,
			role: 'authenticated',
		});
	}
}
