import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { UserPayload } from 'src/shared/domain/types/user-payload';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.usecase';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.usecase';
import { ProfileResponseDto } from '../../application/dtos/profile.response.dto';
import { UpdateProfileDto } from '../../application/dtos/update-profile.dto';

@Controller('profile')
@UseGuards(SupabaseAuthGuard)
export class ProfileController {
	constructor(
		private readonly getProfileUseCase: GetProfileUseCase,
		private readonly updateProfileUseCase: UpdateProfileUseCase
	) {}

	@Get('me')
	getMe(@CurrentUser() user: UserPayload): Promise<ProfileResponseDto> {
		return this.getProfileUseCase.execute({
			id: user.id,
			email: user.email,
		});
	}

	@Patch('me')
	updateMe(
		@CurrentUser() user: UserPayload,
		@Body() dto: UpdateProfileDto
	): Promise<ProfileResponseDto> {
		return this.updateProfileUseCase.execute({
			user: {
				id: user.id,
				email: user.email,
			},
			dto,
		});
	}
}
