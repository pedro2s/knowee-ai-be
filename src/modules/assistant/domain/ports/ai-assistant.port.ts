import { QuestionAnswered } from '../entities/question-answer.types';
import { ConversationContext } from 'src/shared/domain/types/conversation-context';

export interface AskQuestionInput {
	question: string;
	context?: ConversationContext;
}

export interface AIAssistantPort {
	ask(input: AskQuestionInput): Promise<QuestionAnswered>;
}
