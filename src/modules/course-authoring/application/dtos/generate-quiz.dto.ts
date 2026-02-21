import { IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateQuizDto {
	@IsNotEmpty()
	@IsUUID()
	courseId: string;

	@IsNotEmpty()
	@IsUUID()
	moduleId: string;
}
