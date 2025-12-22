import { History } from 'src/modules/history/domain/entities/history.entity';
import { QuestionAnswered } from '../entities/question-answer.types';

export interface ConversationContext {
	summary: string | null;
	recentHistory: History[];
}

export interface AskQuestionInput {
	question: string;
	context?: ConversationContext;
}

export interface AIAssistantPort {
	ask(input: AskQuestionInput): Promise<QuestionAnswered>;
}
