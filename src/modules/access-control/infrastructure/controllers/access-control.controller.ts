import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import type { UserPayload } from 'src/shared/types/user-payload';
import { GetUserEntitlementsUseCase } from '../../application/use-cases/get-user-entitlements.usecase';
import { UserEntitlementsResponseDto } from '../../application/dtos/user-entitlements.response.dto';

@Controller('access-control')
@UseGuards(JwtAuthGuard)
export class AccessControlController {
	constructor(
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase
	) {}

	@Get('/entitlements')
	async getEntitlements(
		@CurrentUser() user: UserPayload
	): Promise<UserEntitlementsResponseDto> {
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		return UserEntitlementsResponseDto.fromDomain(entitlements);
	}
}
