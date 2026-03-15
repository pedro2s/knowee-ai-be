import { PreconditionFailedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAIGenerateAssessmentsAgentAdapter } from './openai-generate-assessments-agent.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAIGenerateAssessmentsAgentAdapter', () => {
	const createMock = jest.fn();
	let adapter: OpenAIGenerateAssessmentsAgentAdapter;

	beforeEach(() => {
		createMock.mockReset();
		const openai = {
			chat: {
				completions: {
					create: createMock,
				},
			},
		} as unknown as OpenAI;
		adapter = new OpenAIGenerateAssessmentsAgentAdapter(
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
							lessons: [
								{
									title: 'Quiz M1',
									description: 'Desc',
									orderIndex: 3,
									moduleId: '11111111-1111-1111-1111-111111111111',
									lessonType: 'quiz',
								},
							],
						}),
					},
				},
			],
			usage: { total_tokens: 200 },
		});

		const result = await adapter.generateAssessments({
			input: {
				course: {
					id: 'course-1',
					title: 'Curso',
					description: 'Desc',
					category: 'Cat',
					level: 'Iniciante',
					duration: '2h',
					targetAudience: 'Todos',
					objectives: 'Obj',
					modules: [],
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
		expect(payload.model).toBe('gpt-4.1-mini');
		expect(payload.temperature).toBe(0.35);
		expect(payload.top_p).toBe(0.75);
		expect(payload.max_completion_tokens).toBe(1536);
		expect(payload.messages).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					role: 'system',
					content: expect.stringContaining('Resumo de conversa'),
				}),
				expect.objectContaining({ role: 'assistant' }),
				expect.objectContaining({
					role: 'user',
					content: expect.stringContaining('Crie sugestões de avaliações'),
				}),
			])
		);
		expect(result).toEqual({
			content: {
				lessons: [
					{
						title: 'Quiz M1',
						description: 'Desc',
						orderIndex: 3,
						moduleId: '11111111-1111-1111-1111-111111111111',
						lessonType: 'quiz',
					},
				],
			},
			tokenUsage: expect.objectContaining({
				totalTokens: 200,
				model: 'gpt-4.1-mini',
				provider: 'openai',
				operation: 'course_authoring.generate_assessments',
				modality: 'text',
				unitType: 'tokens',
				billableUnits: 200,
				totalUnits: 200,
			}),
		});
	});

	it('deve lançar PreconditionFailedException quando content vier vazio', async () => {
		createMock.mockResolvedValue({
			choices: [{ message: { content: null } }],
			usage: { total_tokens: 10 },
		});

		await expect(
			adapter.generateAssessments({
				input: {
					course: {
						id: 'course-1',
						title: 'Curso',
						description: 'Desc',
						category: 'Cat',
						level: 'Iniciante',
						duration: '2h',
						targetAudience: 'Todos',
						objectives: 'Obj',
						modules: [],
					},
				},
				summary: null,
				recentHistory: [],
			})
		).rejects.toThrow(PreconditionFailedException);
	});
});
