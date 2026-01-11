import {
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class CreateLessonDto {
	@IsNotEmpty()
	@IsString()
	title: string;

	@IsNotEmpty()
	@IsString()
	description: string;

	@IsNotEmpty()
	@IsString()
	lessonType: string;

	@IsOptional()
	content: unknown;

	@IsNotEmpty()
	@IsInt()
	orderIndex: number;

	@IsNotEmpty()
	@IsNumber()
	duration?: number;

	@IsNotEmpty()
	@IsString()
	moduleId: string;
}
