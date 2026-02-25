import { UserEntitlements } from '../../domain/entities/access-control.types';

export class UserEntitlementsResponseDto {
	planName: string;
	hasActiveSubscription: boolean;
	subscriptionId: string | null;
	monthlyTokenLimit: number;
	usedTokensInPeriod: number;
	remainingTokensInPeriod: number;
	sampleConsumed: boolean;
	sampleGenerationCount: number;
	freemiumScope: UserEntitlements['freemiumScope'];
	capabilities: UserEntitlements['capabilities'];
	primaryRestriction?: UserEntitlements['primaryRestriction'];

	static fromDomain(input: UserEntitlements): UserEntitlementsResponseDto {
		return {
			planName: input.planName,
			hasActiveSubscription: input.hasActiveSubscription,
			subscriptionId: input.subscriptionId,
			monthlyTokenLimit: input.monthlyTokenLimit,
			usedTokensInPeriod: input.usedTokensInPeriod,
			remainingTokensInPeriod: input.remainingTokensInPeriod,
			sampleConsumed: input.sampleConsumed,
			sampleGenerationCount: input.sampleGenerationCount,
			freemiumScope: input.freemiumScope,
			capabilities: input.capabilities,
			primaryRestriction: input.primaryRestriction,
		};
	}
}
