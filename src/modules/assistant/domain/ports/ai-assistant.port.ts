import { QuestionAnswered } from '../entities/question-answer.types';
import { InteractionContext } from 'src/shared/domain/types/interaction-context';

export interface AskQuestionInput {
	question: string;
}

export interface AIAssistantPort {
	ask(
		context: InteractionContext<AskQuestionInput>,
	): Promise<QuestionAnswered>;
}
