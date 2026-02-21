import { LessonsController } from './lessons.controller';
import type { GenerateQuizUseCase } from '../../application/use-cases/generate-quiz.usecase';

describe('LessonsController', () => {
	it('deve retornar 200 com quizQuestions no generate-quiz', async () => {
		const generateQuizExecuteMock = jest.fn().mockResolvedValue({
			quizQuestions: [
				{
					id: 'q1',
					question: 'Pergunta',
					options: ['A', 'B', 'C', 'D'],
					correctAnswer: 0,
					explanation: 'Explicação',
				},
			],
		});
		const generateQuizUseCase = {
			execute: generateQuizExecuteMock,
		} as unknown as GenerateQuizUseCase;

		const controller = new LessonsController(
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			generateQuizUseCase
		);

		const response = await controller.generateQuiz(
			{
				courseId: '9ef13d89-8f89-4b93-aef5-8857756df453',
				moduleId: '82f2f750-4d37-4f52-915e-9d71580bcf72',
			},
			{ id: 'user-1' } as any
		);

		expect(generateQuizExecuteMock).toHaveBeenCalledWith(
			{
				courseId: '9ef13d89-8f89-4b93-aef5-8857756df453',
				moduleId: '82f2f750-4d37-4f52-915e-9d71580bcf72',
			},
			'user-1'
		);
		expect(response).toEqual({
			quizQuestions: [
				{
					id: 'q1',
					question: 'Pergunta',
					options: ['A', 'B', 'C', 'D'],
					correctAnswer: 0,
					explanation: 'Explicação',
				},
			],
		});
	});
});
