import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAICourseGeneratorAdapter } from './openai-course-generator.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAICourseGeneratorAdapter', () => {
	it('deve aplicar modelo otimizado e limite explícito na geração de curso', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							title: 'Curso',
							description: 'Desc',
							category: 'Cat',
							level: 'Iniciante',
							duration: '2h',
							targetAudience: 'Todos',
							objectives: 'Objetivos',
							modules: [],
						}),
					},
				},
			],
			usage: { total_tokens: 100 },
		});
		const adapter = new OpenAICourseGeneratorAdapter(
			{
				chat: { completions: { create } },
			} as unknown as OpenAI,
			buildPolicyService()
		);

		const result = await adapter.generate({
			courseDetails: {
				title: 'Curso',
				description: 'Desc',
				instructorName: 'Instrutor',
			},
			filesAnalysis: 'Sem arquivos',
		});

		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'gpt-4.1-mini',
				temperature: 0.6,
				top_p: 0.9,
				max_completion_tokens: 4096,
			})
		);
		expect(result.tokenUsage).toEqual(
			expect.objectContaining({
				model: 'gpt-4.1-mini',
				operation: 'course_authoring.generate_course',
				totalTokens: 100,
			})
		);
	});
});
