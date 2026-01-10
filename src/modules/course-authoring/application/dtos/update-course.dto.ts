import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { UpdateModuleDto } from './update-module.dto';

export class UpdateCourseModuleDto extends PartialType(UpdateModuleDto) {
	@IsNotEmpty()
	@IsString()
	id: string;
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
