jest.mock('uuid', () => ({
	v4: () => 'qa-generated-id',
}));

import { QuestionAnswer } from '../../domain/entities/question-answer.entity';
import { AssistantController } from './assistant.controller';
import type { GetChatHistoryUseCase } from '../../application/use-cases/get-chat-history.usecase';
import type { SubmitQuestionUseCase } from '../../application/use-cases/submit-question.usecase';
import type { GenerateTextUseCase } from '../../application/use-cases/generate-text.usecase';
import type { AnalyticsUseCase } from '../../application/use-cases/analytics.usecase';

describe('AssistantController', () => {
	it('deve delegar generateText, analyze, question e getChatHistoryByCourseId', async () => {
		const getChatHistory = {
			execute: jest.fn().mockResolvedValue([
				QuestionAnswer.restore({
					id: 'qa-1',
					userId: 'user-1',
					courseId: 'course-1',
					question: 'Pergunta',
					answer: 'Resposta',
					createdAt: new Date('2026-03-12T12:00:00.000Z'),
				}),
			]),
		} as unknown as jest.Mocked<GetChatHistoryUseCase>;
		const submitQuestion = {
			execute: jest
				.fn()
				.mockResolvedValue({ answer: 'Resposta', action: { status: 'none' } }),
		} as unknown as jest.Mocked<SubmitQuestionUseCase>;
		const generateTextUseCase = {
			execute: jest.fn().mockResolvedValue({ text: 'Texto gerado' }),
		} as unknown as jest.Mocked<GenerateTextUseCase>;
		const analyticsUseCase = {
			execute: jest.fn().mockResolvedValue({ targetAudience: 'Beginners' }),
		} as unknown as jest.Mocked<AnalyticsUseCase>;
		const controller = new AssistantController(
			getChatHistory,
			submitQuestion,
			generateTextUseCase,
			analyticsUseCase
		);
		const user = { id: 'user-1', email: 'user@example.com' } as never;

		await expect(
			controller.generateText(
				{ courseId: 'course-1', prompt: 'Escreva uma intro' },
				user
			)
		).resolves.toEqual({ generatedText: 'Texto gerado' });
		await expect(
			controller.analyze({ title: 'Curso', description: 'Descricao' })
		).resolves.toEqual({ targetAudience: 'Beginners' });
		await expect(
			controller.question({ courseId: 'course-1', question: 'Pergunta?' }, user)
		).resolves.toEqual({ answer: 'Resposta', action: { status: 'none' } });
		await expect(
			controller.getChatHistoryByCourseId('course-1', user)
		).resolves.toEqual([
			{
				id: 'qa-1',
				userId: 'user-1',
				courseId: 'course-1',
				question: 'Pergunta',
				answer: 'Resposta',
				createdAt: '2026-03-12T12:00:00.000Z',
			},
		]);

		expect(generateTextUseCase.execute).toHaveBeenCalledWith(
			{ courseId: 'course-1', prompt: 'Escreva uma intro' },
			'user-1'
		);
		expect(analyticsUseCase.execute).toHaveBeenCalledWith({
			title: 'Curso',
			description: 'Descricao',
		});
		expect(submitQuestion.execute).toHaveBeenCalledWith(
			{ courseId: 'course-1', question: 'Pergunta?' },
			'user-1'
		);
		expect(getChatHistory.execute).toHaveBeenCalledWith({
			courseId: 'course-1',
			userId: 'user-1',
		});
	});
});
