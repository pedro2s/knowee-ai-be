import { PreconditionFailedException } from '@nestjs/common';
import type OpenAI from 'openai';
import { OpenAIQuizGeneratorAdapter } from './openai-quiz-generator.adapter';

describe('OpenAIQuizGeneratorAdapter', () => {
	const createMock = jest.fn();
	let adapter: OpenAIQuizGeneratorAdapter;

	beforeEach(() => {
		createMock.mockReset();
		const openai = {
			chat: {
				completions: {
					create: createMock,
				},
			},
		} as unknown as OpenAI;
		adapter = new OpenAIQuizGeneratorAdapter(openai);
	});

	it('deve montar mensagens, parsear conteúdo e retornar token usage', async () => {
		createMock.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							quizQuestions: [
								{
									question: 'Pergunta 1',
									options: ['A', 'B', 'C', 'D'],
									correctAnswer: 0,
									explanation: 'Explicação',
								},
							],
						}),
					},
				},
			],
			usage: { total_tokens: 87 },
		});

		const result = await adapter.generateQuiz({
			input: {
				module: {
					id: 'module-1',
					courseId: 'course-1',
					title: 'Modulo',
					description: 'Desc',
					orderIndex: 0,
					lessons: [],
				},
			},
			summary: 'Resumo de conversa',
			recentHistory: [
				{
					toPrimitives: () => ({
						message: { role: 'assistant', content: 'Histórico recente' },
					}),
				} as any,
			],
		});

		expect(createMock).toHaveBeenCalledTimes(1);
		const payload = createMock.mock.calls[0][0];
		expect(payload.model).toBe('gpt-4.1');
		expect(payload.messages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					role: 'system',
					content: expect.stringContaining('Resumo de conversa'),
				}),
				expect.objectContaining({
					role: 'assistant',
					content: 'Histórico recente',
				}),
				expect.objectContaining({
					role: 'user',
					content: expect.stringContaining('Módulo:'),
				}),
			])
		);
		expect(result).toEqual({
			content: {
				quizQuestions: [
					{
						question: 'Pergunta 1',
						options: ['A', 'B', 'C', 'D'],
						correctAnswer: 0,
						explanation: 'Explicação',
					},
				],
			},
			tokenUsage: {
				totalTokens: 87,
				model: 'gpt-4.1',
			},
		});
	});

	it('deve lançar PreconditionFailedException quando content vier vazio', async () => {
		createMock.mockResolvedValue({
			choices: [{ message: { content: null } }],
			usage: { total_tokens: 10 },
		});

		await expect(
			adapter.generateQuiz({
				input: {
					module: {
						id: 'module-1',
						courseId: 'course-1',
						title: 'Modulo',
						description: 'Desc',
						orderIndex: 0,
						lessons: [],
					},
				},
				summary: null,
				recentHistory: [],
			})
		).rejects.toThrow(PreconditionFailedException);
	});
});
