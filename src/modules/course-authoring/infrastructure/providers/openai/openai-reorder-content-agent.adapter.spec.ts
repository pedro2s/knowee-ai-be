import { PreconditionFailedException } from '@nestjs/common';
import type OpenAI from 'openai';
import { OpenAIReorderContentAgentAdapter } from './openai-reorder-content-agent.adapter';

describe('OpenAIReorderContentAgentAdapter', () => {
	const createMock = jest.fn();
	let adapter: OpenAIReorderContentAgentAdapter;

	beforeEach(() => {
		createMock.mockReset();
		const openai = {
			chat: {
				completions: {
					create: createMock,
				},
			},
		} as unknown as OpenAI;
		adapter = new OpenAIReorderContentAgentAdapter(openai);
	});

	it('deve montar mensagens, parsear conteúdo e retornar token usage', async () => {
		createMock.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							modules: [{ id: 'module-1', orderIndex: 0 }],
						}),
					},
				},
			],
			usage: { total_tokens: 321 },
		});

		const result = await adapter.reorderContent({
			input: {
				id: 'course-1',
				title: 'Curso',
				description: 'Desc',
				modules: [
					{
						id: 'module-1',
						title: 'M1',
						description: 'D1',
						orderIndex: 0,
						lessons: [],
					},
				],
			},
			summary: 'Resumo da conversa',
			recentHistory: [
				{
					toPrimitives: () => ({
						message: {
							role: 'assistant',
							content: 'Histórico recente',
						},
					}),
				} as any,
			],
		});

		expect(createMock).toHaveBeenCalledTimes(1);
		const payload = createMock.mock.calls[0][0];
		expect(payload.model).toBe('gpt-4.1');
		expect(payload.messages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ role: 'system' }),
				expect.objectContaining({
					role: 'system',
					content: expect.stringContaining('Resumo da conversa'),
				}),
				expect.objectContaining({
					role: 'assistant',
					content: 'Histórico recente',
				}),
				expect.objectContaining({
					role: 'user',
					content: expect.stringContaining(
						'Analise a estrutura atual do curso'
					),
				}),
			])
		);

		expect(result).toEqual({
			content: { modules: [{ id: 'module-1', orderIndex: 0 }] },
			tokenUsage: { totalTokens: 321, model: 'gpt-4.1' },
		});
	});

	it('deve lançar PreconditionFailedException quando content vier vazio', async () => {
		createMock.mockResolvedValue({
			choices: [{ message: { content: null } }],
			usage: { total_tokens: 10 },
		});

		await expect(
			adapter.reorderContent({
				input: {
					id: 'course-1',
					title: 'Curso',
					description: 'Desc',
					modules: [],
				},
				summary: null,
				recentHistory: [],
			})
		).rejects.toThrow(PreconditionFailedException);
	});
});
