import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { BillingCycle } from '../../../application/use-cases/create-checkout-session.usecase';

export class CreateCheckoutSessionRequestDto {
	@IsString()
	@IsNotEmpty()
	plan: string;

	@IsOptional()
	@IsIn(['monthly', 'annual'])
	billingCycle?: BillingCycle;
}
