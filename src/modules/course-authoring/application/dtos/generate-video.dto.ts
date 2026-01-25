import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/application/dtos/ai-provider.dto';

export class GenerateVideoDto {
	@IsNotEmpty()
	@IsUUID()
	lessonId: string;

	@IsNotEmpty()
	@IsString()
	sectionId: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => AIProviderDto)
	ai?: AIProviderDto;
}
