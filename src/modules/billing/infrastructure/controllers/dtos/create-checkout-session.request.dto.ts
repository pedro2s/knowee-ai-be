import { IsIn, IsOptional } from 'class-validator';
import type { BillingCycle } from '../../../application/use-cases/create-checkout-session.usecase';

export class CreateCheckoutSessionRequestDto {
	@IsOptional()
	@IsIn(['monthly', 'annual'])
	billingCycle?: BillingCycle;
}
