export type LLMProviderId = 'openai' | 'google';

export type LLMOperation =
	| 'assistant.generate_text'
	| 'assistant.submit_question'
	| 'assistant.analytics'
	| 'history.summarize'
	| 'course_authoring.generate_course'
	| 'course_authoring.generate_module'
	| 'course_authoring.generate_lesson_script'
	| 'course_authoring.generate_article'
	| 'course_authoring.generate_quiz'
	| 'course_authoring.reorder_content'
	| 'course_authoring.generate_assessments'
	| 'course_authoring.generate_storyboard';

export interface LLMExecutionPolicy {
	provider: LLMProviderId;
	model: string;
	temperature?: number;
	topP?: number;
	frequencyPenalty?: number;
	presencePenalty?: number;
	maxCompletionTokens?: number;
	preferStructuredOutput?: boolean;
	optimized: boolean;
}
