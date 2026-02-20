import { SubscriptionResponseDto } from '../../application/dtos/subscription.response.dto';

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
	getSubscription(userId: string): Promise<SubscriptionResponseDto | null>;
	createFreeSubscription(
		userId: string,
		email: string
	): Promise<SubscriptionResponseDto>;
}

export const USAGE_REPOSITORY = 'USAGE_REPOSITORY';
