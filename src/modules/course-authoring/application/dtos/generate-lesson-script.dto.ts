import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/application/dtos/ai-provider.dto';

export class GenerateLessonScriptDto {
	@IsNotEmpty()
	@IsUUID()
	courseId: string;

	@IsNotEmpty()
	@IsUUID()
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
