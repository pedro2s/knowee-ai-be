import type { ConfigService } from '@nestjs/config';
import { OpenAITextGeneratorAdapter } from './openai-text-generator.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAITextGeneratorAdapter', () => {
	it('deve aplicar policy otimizada para geração de texto utilitária', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [{ message: { content: 'Texto gerado' } }],
			usage: { total_tokens: 22 },
		});
		const adapter = new OpenAITextGeneratorAdapter(
			{
				chat: { completions: { create } },
			} as never,
			buildPolicyService()
		);

		const result = await adapter.generate({
			input: { prompt: 'Explique closures' },
			summary: 'Resumo',
			recentHistory: [],
		});

		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'gpt-4o-mini',
				temperature: 0.3,
				top_p: 0.8,
				max_completion_tokens: 800,
			})
		);
		expect(result).toEqual({
			content: { text: 'Texto gerado' },
			tokenUsage: expect.objectContaining({
				model: 'gpt-4o-mini',
				totalTokens: 22,
				operation: 'assistant.generate_text',
			}),
		});
	});
});
