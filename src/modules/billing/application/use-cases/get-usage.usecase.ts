import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';

@Injectable()
export class GetUsageUseCase {
	constructor(
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort
	) {}

	async execute(userId: string): Promise<{ used: number }> {
		const subscription =
			await this.usageRepository.getLatestSubscriptionSnapshot(userId);

		if (!subscription) {
			throw new NotFoundException(
				'Nenhuma assinatura encontrada para o usuário.'
			);
		}

		let startOfPeriod: Date;
		if (subscription.status === 'active') {
			const startOfSubscription = new Date(subscription.createdAt);
			const today = new Date();

			// Calculation of months between subscription and today.
			let monthsApplied =
				(today.getFullYear() - startOfSubscription.getFullYear()) * 12 +
				(today.getMonth() - startOfSubscription.getMonth());

			// If today's day of the month is less than the subscription's, it's not reached yet.
			if (today.getDate() < startOfSubscription.getDate()) {
				monthsApplied--;
			}

			// Calculate startOfPeriod.
			startOfPeriod = new Date(startOfSubscription);
			startOfPeriod.setMonth(startOfSubscription.getMonth() + monthsApplied);
			startOfPeriod.setHours(0, 0, 0, 0);
		} else {
			startOfPeriod = new Date(0);
		}

		const used = await this.usageRepository.getUsageInPeriod(
			userId,
			subscription.id,
			startOfPeriod
		);

		return { used };
	}
}
