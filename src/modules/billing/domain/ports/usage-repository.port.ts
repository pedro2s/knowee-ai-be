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
}

export const USAGE_REPOSITORY = 'USAGE_REPOSITORY';
