import { Inject, Injectable } from '@nestjs/common';
import { ACCESS_CONTROL_REPOSITORY } from '../../domain/ports/access-control.repository.port';
import { UserEntitlements } from '../../domain/entities/access-control.types';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';

@Injectable()
export class GetUserEntitlementsUseCase {
	constructor(
		@Inject(ACCESS_CONTROL_REPOSITORY)
		private readonly repository: AccessControlRepositoryPort
	) {}

	async execute(userId: string): Promise<UserEntitlements> {
		const subscriber = await this.repository.getLatestSubscriber(userId);
		const hasActiveSubscription = !!subscriber?.subscribed;
		const planName = subscriber?.tierName ?? 'free';
		const monthlyTokenLimit = subscriber?.monthlyTokenLimit ?? 0;

		let usedTokensInPeriod = 0;
		if (hasActiveSubscription && subscriber && monthlyTokenLimit > 0) {
			const anchor = new Date(subscriber.createdAt);
			const now = new Date();

			let monthsApplied =
				(now.getFullYear() - anchor.getFullYear()) * 12 +
				(now.getMonth() - anchor.getMonth());
			if (now.getDate() < anchor.getDate()) {
				monthsApplied--;
			}

			const startOfPeriod = new Date(anchor);
			startOfPeriod.setMonth(anchor.getMonth() + monthsApplied);
			startOfPeriod.setHours(0, 0, 0, 0);

			usedTokensInPeriod = await this.repository.getUsageInPeriod(
				userId,
				subscriber.id,
				startOfPeriod.toISOString()
			);
		}

		let sampleCourseId = subscriber?.sampleCourseId ?? null;
		let sampleConsumed = !!subscriber?.sampleCourseId;
		let sampleGenerationCount = subscriber?.sampleGenerationCount ?? 0;

		if (!sampleConsumed) {
			const courseCount = await this.repository.countUserCourses(userId);
			sampleConsumed = courseCount >= 1;
			sampleGenerationCount = Math.max(sampleGenerationCount, courseCount);
			if (courseCount > 0) {
				sampleCourseId = await this.repository.getFirstCourseId(userId);
			}
		}

		let firstModuleId: string | null = null;
		let firstLessonId: string | null = null;
		if (sampleCourseId) {
			firstModuleId = await this.repository.getFirstModuleId(
				sampleCourseId,
				userId
			);
			if (firstModuleId) {
				firstLessonId = await this.repository.getFirstLessonId(
					firstModuleId,
					userId
				);
			}
		}

		const remaining = Math.max(monthlyTokenLimit - usedTokensInPeriod, 0);

		const capabilities = hasActiveSubscription
			? {
					canCreateCourse: true,
					canAccessPlatform: true,
					canUseAI: remaining > 0 || monthlyTokenLimit === 0,
					canGenerateAssets: remaining > 0 || monthlyTokenLimit === 0,
					canExport: true,
				}
			: {
					canCreateCourse: !sampleConsumed,
					canAccessPlatform: true,
					canUseAI: !sampleConsumed,
					canGenerateAssets: false,
					canExport: false,
				};

		const entitlements: UserEntitlements = {
			planName,
			hasActiveSubscription,
			subscriptionId: subscriber?.id ?? null,
			monthlyTokenLimit,
			usedTokensInPeriod,
			remainingTokensInPeriod: remaining,
			sampleConsumed,
			sampleGenerationCount,
			freemiumScope: {
				sampleCourseId,
				firstModuleId,
				firstLessonId,
			},
			capabilities,
		};

		if (!hasActiveSubscription && sampleConsumed) {
			entitlements.primaryRestriction = {
				code: 'SUBSCRIPTION_REQUIRED',
				message:
					'Você utilizou a amostra gratuita. Assine para continuar com todos os recursos.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (hasActiveSubscription && monthlyTokenLimit > 0 && remaining <= 0) {
			entitlements.primaryRestriction = {
				code: 'TOKEN_LIMIT_EXCEEDED',
				message:
					'Seu limite mensal de tokens foi atingido. Faça upgrade para continuar.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		return entitlements;
	}
}
