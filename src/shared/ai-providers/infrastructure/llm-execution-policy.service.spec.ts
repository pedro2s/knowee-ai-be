import type { ConfigService } from '@nestjs/config';
import { LLMExecutionPolicyService } from './llm-execution-policy.service';

const buildConfigService = (enabled: boolean) =>
	({
		get: jest
			.fn()
			.mockImplementation((key: string) =>
				key === 'LLM_OPTIMIZED_POLICY_ENABLED' && enabled ? 'true' : 'false'
			),
	}) as unknown as jest.Mocked<ConfigService>;

describe('LLMExecutionPolicyService', () => {
	it('deve retornar policy otimizada para tarefas estruturadas quando a flag estiver ativa', () => {
		const service = new LLMExecutionPolicyService(buildConfigService(true));

		expect(service.resolve('course_authoring.generate_quiz', 'openai')).toEqual(
			expect.objectContaining({
				optimized: true,
				model: 'gpt-4.1-mini',
				temperature: 0.3,
				topP: 0.7,
				maxCompletionTokens: 1536,
			})
		);
	});

	it('deve retornar policy legada quando a flag estiver desligada', () => {
		const service = new LLMExecutionPolicyService(buildConfigService(false));

		expect(service.resolve('course_authoring.generate_quiz', 'openai')).toEqual(
			expect.objectContaining({
				optimized: false,
				model: 'gpt-4.1',
				temperature: 1,
				topP: 1,
				maxCompletionTokens: 2048,
			})
		);
	});

	it('deve preservar o provider/modelo do analytics em google', () => {
		const service = new LLMExecutionPolicyService(buildConfigService(true));

		expect(service.resolve('assistant.analytics', 'google')).toEqual(
			expect.objectContaining({
				provider: 'google',
				model: 'gemini-3-flash-preview',
				optimized: true,
			})
		);
	});
});
