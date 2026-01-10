import { Type } from 'class-transformer';
import {
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';

export class UpdateCourseModuleDto {
	@IsNotEmpty()
	@IsString()
	id: string;

	@IsOptional()
	@IsString()
	title: string;

	@IsOptional()
	@IsInt()
	orderIndex: number;

	@IsOptional()
	@IsString()
	description?: string;
}

export class UpdateCourseDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	level?: string;

	@IsOptional()
	@IsString()
	duration?: string;

	@IsOptional()
	@IsString()
	targetAudience?: string;

	@IsOptional()
	@IsString()
	objectives?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => UpdateCourseModuleDto)
	modules: Array<UpdateCourseModuleDto>;
}
