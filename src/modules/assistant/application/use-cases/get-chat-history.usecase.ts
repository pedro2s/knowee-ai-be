import { Injectable } from '@nestjs/common';
import { QuestionAnswer } from '../../domain/entities/question-answer.entity';
import { QuestionAnswerRepositoryPort } from '../../domain/ports/question-anwer-repository.port';

@Injectable()
export class GetChatHistoryUseCase {
	constructor(
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
