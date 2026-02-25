import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';

export interface PublicSubscriptionTierData {
	name: string;
	displayName: string;
	monthlyTokenLimit: number;
	price: string | null;
	billingPeriod: string | null;
	description: string | null;
	features: string[];
	isHighlighted: boolean;
	isContactOnly: boolean;
	sortOrder: number;
	supportChannel: string;
	supportSlaHours: number;
}

export interface UsageRepositoryPort {
	getUsageInPeriod(
		userId: string,
		subscriptionId: string,
		startDate: Date
	): Promise<number>;
	getActiveSubscription(userId: string): Promise<{
		id: string;
		createdAt: string;
	} | null>;
	getLatestSubscriptionSnapshot(userId: string): Promise<{
		id: string;
		createdAt: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
	} | null>;
	getSubscription(userId: string): Promise<SubscriptionResponseDto | null>;
	createFreeSubscription(
		userId: string,
		email: string
	): Promise<SubscriptionResponseDto>;
	getSubscriptionTierByName(name: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
	} | null>;
	getSubscriptionTierByStripePriceId(priceId: string): Promise<{
		id: number;
		name: string;
		monthlyTokenLimit: number;
		price: string | null;
		stripePriceId: string | null;
	} | null>;
	listPublicSubscriptionTiers(): Promise<PublicSubscriptionTierData[]>;
	getLatestSubscriberForUser(userId: string): Promise<{
		id: string;
		status: 'free' | 'active' | 'past_due' | 'canceled';
		subscriptionTierId: number | null;
		stripeCustomerId: string | null;
		stripeSubscriptionId: string | null;
	} | null>;
	updateSubscriberById(
		id: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void>;
	updateSubscriberByStripeSubscriptionId(
		stripeSubscriptionId: string,
		patch: {
			status?: 'free' | 'active' | 'past_due' | 'canceled';
			subscriptionTierId?: number;
			stripeCustomerId?: string | null;
			subscriptionEnd?: string | null;
		}
	): Promise<void>;
}

export const USAGE_REPOSITORY = 'USAGE_REPOSITORY';
