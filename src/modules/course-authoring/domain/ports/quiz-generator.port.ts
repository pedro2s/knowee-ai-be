import { GeneratedQuiz, GenerateQuizInput } from '../entities/quiz.types';
import {
	InteractionContext,
	InteractionResult,
} from 'src/shared/types/interaction';

export const QUIZ_GENERATOR = Symbol('QUIZ_GENERATOR');

export interface QuizGeneratorPort {
	generateQuiz(
		context: InteractionContext<GenerateQuizInput>
	): Promise<InteractionResult<GeneratedQuiz>>;
}
