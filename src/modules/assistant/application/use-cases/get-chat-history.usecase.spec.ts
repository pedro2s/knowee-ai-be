jest.mock('uuid', () => ({
	v4: () => 'qa-generated-id',
}));

import { GetChatHistoryUseCase } from './get-chat-history.usecase';
import { QuestionAnswer } from '../../domain/entities/question-answer.entity';
import type { QuestionAnswerRepositoryPort } from '../../domain/ports/question-anwer-repository.port';

describe('GetChatHistoryUseCase', () => {
	it('deve buscar o historico do curso com contexto autenticado', async () => {
		const history = [
			QuestionAnswer.restore({
				id: 'qa-1',
				userId: 'user-1',
				courseId: 'course-1',
				question: 'Pergunta',
				answer: 'Resposta',
				createdAt: new Date('2026-03-12T12:00:00.000Z'),
			}),
		];
		const questionAnswerRepository = {
			findAllByCourseId: jest.fn().mockResolvedValue(history),
		} as unknown as jest.Mocked<QuestionAnswerRepositoryPort>;

		const useCase = new GetChatHistoryUseCase(questionAnswerRepository);

		await expect(
			useCase.execute({ courseId: 'course-1', userId: 'user-1' })
		).resolves.toBe(history);
		expect(questionAnswerRepository.findAllByCourseId).toHaveBeenCalledWith(
			'course-1',
			{
				userId: 'user-1',
				role: 'authenticated',
			}
		);
	});
});
