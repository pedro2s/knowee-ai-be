import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAIArticleGeneratorAdapter } from './openai-article-generator.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAIArticleGeneratorAdapter', () => {
	it('deve usar modelo otimizado e limitar histórico recente', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [{ message: { content: '<h1>Artigo</h1>' } }],
			usage: { total_tokens: 42 },
		});
		const adapter = new OpenAIArticleGeneratorAdapter(
			{
				chat: { completions: { create } },
			} as unknown as OpenAI,
			buildPolicyService()
		);

		const recentHistory = Array.from({ length: 5 }, (_, index) => ({
			toPrimitives: () => ({
				message: {
					role: 'assistant',
					content: `Histórico ${index + 1}`,
				},
			}),
		}));

		const result = await adapter.generate({
			input: {
				moduleTitle: 'Módulo',
				moduleDescription: 'Desc módulo',
				lessonTitle: 'Aula',
				lessonDescription: 'Desc aula',
			},
			summary: 'Resumo',
			recentHistory,
		});

		const payload = create.mock.calls[0][0];
		expect(payload.model).toBe('gpt-4.1-mini');
		expect(payload.temperature).toBe(0.55);
		expect(payload.top_p).toBe(0.9);
		expect(payload.max_completion_tokens).toBe(4096);
		expect(JSON.stringify(payload.messages)).not.toContain('Histórico 1');
		expect(JSON.stringify(payload.messages)).toContain('Histórico 5');
		expect(result.tokenUsage).toEqual(
			expect.objectContaining({
				model: 'gpt-4.1-mini',
				operation: 'course_authoring.generate_article',
				totalTokens: 42,
			})
		);
	});
});
