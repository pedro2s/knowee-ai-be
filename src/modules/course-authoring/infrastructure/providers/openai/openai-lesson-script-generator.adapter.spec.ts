import type { ConfigService } from '@nestjs/config';
import type OpenAI from 'openai';
import { OpenAILessonScriptGeneratorAdapter } from './openai-lesson-script-generator.adapter';
import { LLMExecutionPolicyService } from 'src/shared/ai-providers/infrastructure/llm-execution-policy.service';

const buildPolicyService = (enabled = true) =>
	new LLMExecutionPolicyService({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	} as unknown as jest.Mocked<ConfigService>);

describe('OpenAILessonScriptGeneratorAdapter', () => {
	it('deve manter modelo premium com criatividade reduzida e histórico limitado', async () => {
		const create = jest.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							scriptSections: [
								{
									id: 'section-1',
									content: 'Olá',
									isRecorded: false,
									status: 'draft',
									notes: '',
									time: 0,
									timerActive: false,
								},
							],
						}),
					},
				},
			],
			usage: { total_tokens: 80 },
		});
		const adapter = new OpenAILessonScriptGeneratorAdapter(
			{
				chat: { completions: { create } },
			} as unknown as OpenAI,
			buildPolicyService()
		);

		const recentHistory = Array.from({ length: 6 }, (_, index) => ({
			toPrimitives: () => ({
				message: {
					role: 'assistant',
					content: `Histórico ${index + 1}`,
				},
			}),
		}));

		const result = await adapter.generate({
			input: {
				title: 'Aula',
				description: 'Desc',
			},
			summary: 'Resumo',
			recentHistory,
		});

		const payload = create.mock.calls[0][0];
		expect(payload.model).toBe('gpt-4.1');
		expect(payload.temperature).toBe(0.75);
		expect(payload.top_p).toBe(0.9);
		expect(payload.max_completion_tokens).toBe(4096);
		expect(JSON.stringify(payload.messages)).not.toContain('Histórico 1');
		expect(JSON.stringify(payload.messages)).toContain('Histórico 6');
		expect(result.tokenUsage).toEqual(
			expect.objectContaining({
				model: 'gpt-4.1',
				operation: 'course_authoring.generate_lesson_script',
				totalTokens: 80,
			})
		);
	});
});
