import {
	ArrayNotEmpty,
	IsArray,
	IsIn,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProviderSelectionDto {
	@IsString()
	imageProvider: string;

	@IsString()
	audioProvider: string;

	@IsString()
	audioVoiceId: string;

	@IsString()
	videoProvider: string;

	@IsOptional()
	@IsObject()
	advancedSettings?: Record<string, unknown>;
}

export class StartAssetsGenerationDto {
	@IsUUID()
	courseId: string;

	@IsString()
	@IsIn(['on-demand', 'selected', 'all'])
	strategy: 'on-demand' | 'selected' | 'all';

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID('4', { each: true })
	lessonIds?: string[];

	@ValidateNested()
	@Type(() => ProviderSelectionDto)
	providerSelection: ProviderSelectionDto;
}
