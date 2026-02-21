import { Inject, Injectable } from '@nestjs/common';
import {
	USAGE_REPOSITORY,
	type UsageRepositoryPort,
} from '../../domain/ports/usage-repository.port';
import { SubscriptionResponseDto } from '../dtos/subscription.response.dto';

@Injectable()
export class CreateFreeSubscriptionUseCase {
	constructor(
		@Inject(USAGE_REPOSITORY)
		private readonly usageRepository: UsageRepositoryPort
	) {}

	async execute(
		userId: string,
		email: string
	): Promise<SubscriptionResponseDto> {
		return this.usageRepository.createFreeSubscription(userId, email);
	}
}
