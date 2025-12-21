import { QuestionAnswered } from 'src/modules/assistant/domain/entities/question-answer.types';
import { AIAssistantPort } from 'src/modules/assistant/domain/ports/ai-assistant.port';

export class OpeanAIAssistantAdapter implements AIAssistantPort {
	async ask(input: {
		question: string;
		model: string;
	}): Promise<QuestionAnswered> {
		throw new Error('Method not implemented.');
	}
}
