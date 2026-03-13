import { Injectable } from '@nestjs/common';
import { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';
import { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';

@Injectable()
export class MarkFreemiumSampleConsumedUseCase {
	constructor(
		private readonly repository: AccessControlRepositoryPort,
		private readonly getUserEntitlementsUseCase: GetUserEntitlementsUseCase
	) {}

	async execute(userId: string, sampleCourseId: string): Promise<void> {
		const entitlements = await this.getUserEntitlementsUseCase.execute(userId);
		if (entitlements.hasActiveSubscription) {
			return;
		}
		if (entitlements.sampleConsumed) {
			return;
		}

		await this.repository.markSampleConsumed(userId, sampleCourseId);
	}
}
