import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitQuestionDto {
	@IsString()
	@IsNotEmpty()
	courseId: string;

	@IsString()
	@IsNotEmpty()
	question: string;

	@IsString()
	@IsOptional()
	provider: string;
}
