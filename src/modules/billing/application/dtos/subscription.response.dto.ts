export class SubscriptionTierDto {
	id: number;
	name: string;
	monthlyTokenLimit: number;
	price: string | null;
	annualPrice: string | null;
	stripePriceId: string | null;
	stripePriceIdAnnual: string | null;
}

export class SubscriptionResponseDto {
	status: 'free' | 'active' | 'past_due' | 'canceled';
	subscription_tier: SubscriptionTierDto | null;
	subscription_end: string | null;
	stripe_customer_id: string | null;

	static default(): SubscriptionResponseDto {
		return {
			status: 'free',
			subscription_tier: null,
			subscription_end: null,
			stripe_customer_id: null,
		};
	}
}
