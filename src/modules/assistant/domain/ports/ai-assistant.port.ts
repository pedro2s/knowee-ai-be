import { QuestionAnswered } from '../entities/question-answer.types';

export interface AIAssistantPort {
	ask(input: { question: string; model: string }): Promise<QuestionAnswered>;
}
