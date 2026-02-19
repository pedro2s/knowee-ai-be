import { Inject, Injectable } from '@nestjs/common';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';
import { SubscriptionResponseDto } from '../dtos/subscription.response.dto';

@Injectable()
export class GetSubscriptionUseCase {
	constructor(
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort
	) {}

	async execute(userId: string): Promise<SubscriptionResponseDto> {
		const subscription = await this.usageRepository.getSubscription(userId);

		if (!subscription) {
			return SubscriptionResponseDto.default();
		}

		return subscription;
	}
}
