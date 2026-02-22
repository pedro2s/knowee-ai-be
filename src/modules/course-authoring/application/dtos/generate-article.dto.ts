import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/ai-providers/application/dtos/ai-provider.dto';

export class GenerateArticleDto {
	@IsNotEmpty()
	@IsString()
	courseId: string;

	@IsNotEmpty()
	@IsString()
	moduleId: string;

	@IsNotEmpty()
	@IsString()
	title: string;

	@IsNotEmpty()
	@IsString()
	description: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => AIProviderDto)
	ai: AIProviderDto;
}
