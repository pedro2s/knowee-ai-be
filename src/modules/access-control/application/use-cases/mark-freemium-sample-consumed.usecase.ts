import { Inject, Injectable } from '@nestjs/common';
import { ACCESS_CONTROL_REPOSITORY } from '../../domain/ports/access-control.repository.port';
import { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';

@Injectable()
export class MarkFreemiumSampleConsumedUseCase {
	constructor(
		@Inject(ACCESS_CONTROL_REPOSITORY)
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
