import { QuestionAnsweredAction } from '../../domain/entities/question-answer.types';

export class QuestionAnsweredResponseDto {
	answer: string;
	action?: QuestionAnsweredAction;
}
