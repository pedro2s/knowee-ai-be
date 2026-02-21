export class SubscriptionTierDto {
	id: number;
	name: string;
	monthlyTokenLimit: number;
	price: string | null;
	stripePriceId: string | null;
}

export class SubscriptionResponseDto {
	subscribed: boolean;
	subscription_tier: SubscriptionTierDto | null;
	subscription_end: string | null;
	stripe_customer_id: string | null;

	static default(): SubscriptionResponseDto {
		return {
			subscribed: false,
			subscription_tier: null,
			subscription_end: null,
			stripe_customer_id: null,
		};
	}
}
