import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	LLMExecutionPolicy,
	LLMOperation,
	LLMProviderId,
} from '../domain/llm-execution-policy';

type PolicyMap = Record<LLMOperation, Omit<LLMExecutionPolicy, 'optimized'>>;

@Injectable()
export class LLMExecutionPolicyService {
	private readonly optimizedPolicy: PolicyMap = {
		'assistant.generate_text': {
			provider: 'openai',
			model: 'gpt-4o-mini',
			temperature: 0.3,
			topP: 0.8,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 800,
		},
		'assistant.submit_question': {
			provider: 'openai',
			model: 'gpt-4o-mini',
			temperature: 0.2,
			topP: 0.8,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 800,
		},
		'assistant.analytics': {
			provider: 'openai',
			model: 'gpt-4.1-nano',
			temperature: 0.1,
			topP: 0.2,
			maxCompletionTokens: 400,
			preferStructuredOutput: true,
		},
		'history.summarize': {
			provider: 'openai',
			model: 'gpt-4o-mini',
			temperature: 0,
			maxCompletionTokens: 400,
		},
		'course_authoring.generate_course': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.6,
			topP: 0.9,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 4096,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_module': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.5,
			topP: 0.85,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 2048,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_lesson_script': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 0.75,
			topP: 0.9,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 4096,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_article': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.55,
			topP: 0.9,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 4096,
		},
		'course_authoring.generate_quiz': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.3,
			topP: 0.7,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 1536,
			preferStructuredOutput: true,
		},
		'course_authoring.reorder_content': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.2,
			topP: 0.6,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 1024,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_assessments': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.35,
			topP: 0.75,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 1536,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_storyboard': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.3,
			topP: 0.9,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 2048,
			preferStructuredOutput: true,
		},
	};

	private readonly legacyOpenAIPolicy: PolicyMap = {
		'assistant.generate_text': {
			provider: 'openai',
			model: 'gpt-4o-mini',
		},
		'assistant.submit_question': {
			provider: 'openai',
			model: 'gpt-4o-mini',
		},
		'assistant.analytics': {
			provider: 'openai',
			model: 'gpt-4.1-nano',
			preferStructuredOutput: true,
		},
		'history.summarize': {
			provider: 'openai',
			model: 'gpt-4o-mini',
			temperature: 0,
			maxCompletionTokens: 400,
		},
		'course_authoring.generate_course': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_module': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_lesson_script': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_article': {
			provider: 'openai',
			model: 'gpt-4.1',
		},
		'course_authoring.generate_quiz': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 2048,
			preferStructuredOutput: true,
		},
		'course_authoring.reorder_content': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 2048,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_assessments': {
			provider: 'openai',
			model: 'gpt-4.1',
			temperature: 1,
			topP: 1,
			frequencyPenalty: 0,
			presencePenalty: 0,
			maxCompletionTokens: 2048,
			preferStructuredOutput: true,
		},
		'course_authoring.generate_storyboard': {
			provider: 'openai',
			model: 'gpt-4.1-mini',
			temperature: 0.3,
			topP: 0.9,
			frequencyPenalty: 0,
			presencePenalty: 0,
			preferStructuredOutput: true,
		},
	};

	private readonly legacyGooglePolicy: Record<
		Extract<LLMOperation, 'assistant.analytics'>,
		Omit<LLMExecutionPolicy, 'optimized'>
	> = {
		'assistant.analytics': {
			provider: 'google',
			model: 'gemini-3-flash-preview',
			preferStructuredOutput: true,
		},
	};

	constructor(private readonly configService: ConfigService) {}

	resolve(
		operation: LLMOperation,
		provider: LLMProviderId
	): LLMExecutionPolicy {
		const optimized = this.isOptimizedEnabled();
		const policy =
			provider === 'google'
				? this.legacyGooglePolicy[operation as 'assistant.analytics']
				: optimized
					? this.optimizedPolicy[operation]
					: this.legacyOpenAIPolicy[operation];

		return {
			...policy,
			provider,
			optimized,
		};
	}

	private isOptimizedEnabled(): boolean {
		return (
			this.configService.get<string>('LLM_OPTIMIZED_POLICY_ENABLED') === 'true'
		);
	}
}
