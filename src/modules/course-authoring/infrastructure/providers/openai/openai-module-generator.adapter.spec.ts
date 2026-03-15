import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAIModuleGeneratorAdapter } from './openai-module-generator.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAIModuleGeneratorAdapter', () => {
	it('deve usar policy otimizada e projetar o contexto do curso', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							title: 'Novo módulo',
							description: 'Desc',
							orderIndex: 1,
							lessons: [],
						}),
					},
				},
			],
			usage: { total_tokens: 50 },
		});
		const adapter = new OpenAIModuleGeneratorAdapter(
			{
				chat: { completions: { create } },
			} as unknown as OpenAI,
			buildPolicyService()
		);

		const result = await adapter.generate({
			input: {
				currentCourseStructure: {
					title: 'Curso',
					description: 'Desc',
					modules: [
						{
							title: 'M1',
							description: 'D1',
							orderIndex: 0,
							lessons: [
								{
									title: 'L1',
									description: 'LD1',
									lessonType: 'article',
									orderIndex: 0,
								},
							],
						},
					],
				},
			},
			summary: 'Resumo',
			recentHistory: [],
		});

		const payload = create.mock.calls[0][0];
		expect(payload.model).toBe('gpt-4.1-mini');
		expect(payload.temperature).toBe(0.5);
		expect(payload.top_p).toBe(0.85);
		expect(payload.max_completion_tokens).toBe(2048);
		expect(JSON.stringify(payload.messages)).not.toContain('"id"');
		expect(result.tokenUsage).toEqual(
			expect.objectContaining({
				model: 'gpt-4.1-mini',
				operation: 'course_authoring.generate_module',
				totalTokens: 50,
			})
		);
	});
});
