import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/ai-providers/application/dtos/ai-provider.dto';

export class GenerateTextDto {
	@IsString()
	@IsNotEmpty()
	prompt: string;

	@IsString()
	@IsNotEmpty()
	courseId: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => AIProviderDto)
	ai?: AIProviderDto;
}
