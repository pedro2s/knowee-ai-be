import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from 'src/modules/auth/infrastructure/guards/supabase-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import { type UserPayload } from 'src/shared/types/user-payload';
import { GetUsageUseCase } from '../../application/use-cases/get-usage.usecase';
import { GetSubscriptionUseCase } from '../../application/use-cases/get-subscription.usecase';
import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';
import { CreateFreeSubscriptionUseCase } from '../../application/use-cases/create-free-subscription.usecase';
import { GetUserEntitlementsUseCase } from 'src/modules/access-control/application/use-cases/get-user-entitlements.usecase';
import { UserEntitlementsResponseDto } from 'src/modules/access-control/application/dtos/user-entitlements.response.dto';
import { CreateCheckoutSessionUseCase } from '../../application/use-cases/create-checkout-session.usecase';

@Controller('billing')
@UseGuards(SupabaseAuthGuard)
export class BillingController {
	constructor(
		private readonly getUsageUseCase: GetUsageUseCase,
		private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
		private readonly createFreeSubscriptionUseCase: CreateFreeSubscriptionUseCase,
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase,
		private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase
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

	@Get('entitlements')
	async getEntitlements(
		@CurrentUser() user: UserPayload
	): Promise<UserEntitlementsResponseDto> {
		const entitlements = await this.getUserEntitlementsUseCase.execute(user.id);
		return UserEntitlementsResponseDto.fromDomain(entitlements);
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

	@Post('checkout/:plan')
	async checkout(
		@CurrentUser() user: UserPayload,
		@Param('plan') plan: string
	): Promise<{ url: string }> {
		return this.createCheckoutSessionUseCase.execute({
			userId: user.id,
			email: user.email,
			planName: plan,
		});
	}
}
