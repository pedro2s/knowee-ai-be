import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { GetProviderCatalogUseCase } from '../../application/use-cases/get-provider-catalog.usecase';
import { GetProviderPreferencesUseCase } from '../../application/use-cases/get-provider-preferences.usecase';
import { UpdateProviderPreferencesUseCase } from '../../application/use-cases/update-provider-preferences.usecase';
import {
	EffectiveProviderPreferencesResponseDto,
	ProviderCatalogResponseDto,
} from '../../application/dtos/provider-preferences.response.dto';
import { UpdateProviderPreferencesDto } from '../../application/dtos/update-provider-preferences.dto';

@Controller('providers')
@UseGuards(SupabaseAuthGuard)
export class ProviderPreferencesController {
	constructor(
		private readonly getProviderCatalogUseCase: GetProviderCatalogUseCase,
		private readonly getProviderPreferencesUseCase: GetProviderPreferencesUseCase,
		private readonly updateProviderPreferencesUseCase: UpdateProviderPreferencesUseCase
	) {}

	@Get('/catalog')
	getCatalog(): ProviderCatalogResponseDto {
		const catalog = this.getProviderCatalogUseCase.execute();
		return ProviderCatalogResponseDto.fromDomain(catalog);
	}

	@Get('/preferences')
	async getPreferences(
		@CurrentUser() user: UserPayload,
		@Query('courseId') courseId?: string
	): Promise<EffectiveProviderPreferencesResponseDto> {
		const prefs = await this.getProviderPreferencesUseCase.execute({
			userId: user.id,
			courseId: courseId || undefined,
		});
		return EffectiveProviderPreferencesResponseDto.fromDomain(prefs);
	}

	@Put('/preferences')
	async updatePreferences(
		@CurrentUser() user: UserPayload,
		@Body() dto: UpdateProviderPreferencesDto
	): Promise<EffectiveProviderPreferencesResponseDto> {
		await this.updateProviderPreferencesUseCase.execute({
			userId: user.id,
			selection: {
				imageProvider: dto.imageProvider,
				audioProvider: dto.audioProvider,
				audioVoiceId: dto.audioVoiceId,
				videoProvider: dto.videoProvider,
				advancedSettings: dto.advancedSettings ?? {},
			},
		});

		const prefs = await this.getProviderPreferencesUseCase.execute({
			userId: user.id,
		});
		return EffectiveProviderPreferencesResponseDto.fromDomain(prefs);
	}
}
