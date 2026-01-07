import { QuestionAnswered } from '../entities/question-answer.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/domain/types/interaction';

export interface AskQuestionInput {
	question: string;
}

export interface AIAssistantPort {
	ask(
		context: InteractionContext<AskQuestionInput>,
	): Promise<InteractionResult<QuestionAnswered>>;
}
