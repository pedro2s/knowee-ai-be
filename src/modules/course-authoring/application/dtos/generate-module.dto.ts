import { Type } from 'class-transformer';
import {
	IsNotEmpty,
	IsOptional,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { AIProviderDto } from 'src/shared/ai-providers/application/dtos/ai-provider.dto';

export class GenerateModuleDto {
	@IsNotEmpty()
	@IsUUID()
	readonly courseId: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => AIProviderDto)
	readonly ai: AIProviderDto;
}
