import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { AIProviderDto } from 'src/shared/ai-providers/application/dtos/ai-provider.dto';

export class GenerateLessonAudioDto {
	@IsOptional()
	@ValidateNested()
	@Type(() => AIProviderDto)
	ai?: AIProviderDto;

	@IsOptional()
	@IsString()
	audioVoiceId?: string;
}
