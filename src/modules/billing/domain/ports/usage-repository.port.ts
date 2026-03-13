import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';

export interface PublicSubscriptionTierData {
	name: string;
	displayName: string;
	monthlyTokenLimit: number;
	price: string | null;
	annualPrice: string | null;
	billingPeriod: string | null;
	description: string | null;
	features: string[];
	isHighlighted: boolean;
	isContactOnly: boolean;
	sortOrder: number;
	supportChannel: string;
	supportSlaHours: number;
}

export abstract class UsageRepositoryPort {
	abstract getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDate: Date
	): Promise<number>;
	abstract getActiveSubscription(userId: string): Promise<{
		id: string;
		createdAt: string;
	} | null>;
	abstract getLatestSubscriptionSnapshot(userId: string): Promise<{
		id: string;
		createdAt: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
	} | null>;
	abstract getSubscription(
		userId: string
	): Promise<SubscriptionResponseDto | null>;
	abstract createFreeSubscription(
		userId: string,
		email: string
	): Promise<SubscriptionResponseDto>;
	abstract getSubscriptionTierByName(name: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
		stripePriceIdAnnual: string | null;
	} | null>;
	abstract getSubscriptionTierByStripePriceId(priceId: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
		stripePriceIdAnnual: string | null;
	} | null>;
	abstract listPublicSubscriptionTiers(): Promise<PublicSubscriptionTierData[]>;
	abstract getLatestSubscriberForUser(userId: string): Promise<{
		id: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
		subscriptionTierId: number | null;
		stripeCustomerId: string | null;
		stripeSubscriptionId: string | null;
	} | null>;
	abstract updateSubscriberById(
		id: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void>;
	abstract updateSubscriberByStripeSubscriptionId(
		stripeSubscriptionId: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void>;
}
