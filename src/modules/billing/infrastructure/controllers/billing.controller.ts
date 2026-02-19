import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/infrastructure/decorators';
import { type UserPayload } from 'src/shared/domain/types/user-payload';
import { GetUsageUseCase } from '../../application/use-cases/get-usage.usecase';
import { GetSubscriptionUseCase } from '../../application/use-cases/get-subscription.usecase';
import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';

@Controller('billing')
@UseGuards(SupabaseAuthGuard)
export class BillingController {
	constructor(
		private readonly getUsageUseCase: GetUsageUseCase,
		private readonly getSubscriptionUseCase: GetSubscriptionUseCase
	) {}

	@Get('usage')
	async getUsage(@CurrentUser() user: UserPayload): Promise<{ used: number }> {
		return this.getUsageUseCase.execute(user.id);
	}

	@Get('subscription')
	async getSubscription(
		@CurrentUser() user: UserPayload
	): Promise<SubscriptionResponseDto> {
		return this.getSubscriptionUseCase.execute(user.id);
	}
}
