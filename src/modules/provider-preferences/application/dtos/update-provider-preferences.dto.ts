import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateProviderPreferencesDto {
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
