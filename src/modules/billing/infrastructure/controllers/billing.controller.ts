import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import { type UserPayload } from 'src/shared/types/user-payload';
import { GetUsageUseCase } from '../../application/use-cases/get-usage.usecase';
import { GetSubscriptionUseCase } from '../../application/use-cases/get-subscription.usecase';
import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';
import { Post } from '@nestjs/common';
import { CreateFreeSubscriptionUseCase } from '../../application/use-cases/create-free-subscription.usecase';

@Controller('billing')
@UseGuards(SupabaseAuthGuard)
export class BillingController {
	constructor(
		private readonly getUsageUseCase: GetUsageUseCase,
		private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
		private readonly createFreeSubscriptionUseCase: CreateFreeSubscriptionUseCase
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

	@Post('subscription/free')
	async createFreeSubscription(
		@CurrentUser() user: UserPayload
	): Promise<{ message: string; subscription: SubscriptionResponseDto }> {
		const subscription = await this.createFreeSubscriptionUseCase.execute(
			user.id,
			user.email
		);

		return {
			message: 'Plano gratuito ativado',
			subscription,
		};
	}
}
