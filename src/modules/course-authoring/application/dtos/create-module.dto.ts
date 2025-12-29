import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateModuleDto {
	@IsString()
	@IsNotEmpty()
	courseId: string;

	@IsString()
	@IsNotEmpty()
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsInt()
	@IsNotEmpty()
	orderIndex: number;
}
