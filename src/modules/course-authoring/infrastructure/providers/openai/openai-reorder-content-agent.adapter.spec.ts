import { PreconditionFailedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAIReorderContentAgentAdapter } from './openai-reorder-content-agent.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

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
		adapter = new OpenAIReorderContentAgentAdapter(
			openai,
			buildPolicyService()
		);
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
		expect(payload.model).toBe('gpt-4.1-mini');
		expect(payload.temperature).toBe(0.2);
		expect(payload.top_p).toBe(0.6);
		expect(payload.max_completion_tokens).toBe(1024);
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
		expect(JSON.stringify(payload.messages)).not.toContain('"courseId"');

		expect(result).toEqual({
			content: { modules: [{ id: 'module-1', orderIndex: 0 }] },
			tokenUsage: expect.objectContaining({
				totalTokens: 321,
				model: 'gpt-4.1-mini',
				provider: 'openai',
				operation: 'course_authoring.reorder_content',
				modality: 'text',
				unitType: 'tokens',
				billableUnits: 321,
				totalUnits: 321,
			}),
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
