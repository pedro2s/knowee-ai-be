import { Injectable } from '@nestjs/common';
import { UserEntitlements } from '../../domain/entities/access-control.types';
import { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';
import { AICreditService } from 'src/shared/token-usage/infrastructure/ai-credit.service';

@Injectable()
export class GetUserEntitlementsUseCase {
	constructor(
		private readonly repository: AccessControlRepositoryPort,
		private readonly aiCreditService: AICreditService
	) {}

	async execute(userId: string): Promise<UserEntitlements> {
		const subscriber = await this.repository.getLatestSubscriber(userId);
		const status = subscriber?.status ?? 'free';
		const hasActiveSubscription = status === 'active';
		const planName = subscriber?.tierName ?? 'free';
		const monthlyTokenLimit = subscriber?.monthlyTokenLimit ?? 0;

		let usedTokensInPeriod = 0;
		if (subscriber && monthlyTokenLimit > 0) {
			if (hasActiveSubscription) {
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
			} else {
				usedTokensInPeriod = await this.repository.getUsageInPeriod(
					userId,
					subscriber.id,
					new Date(0).toISOString()
				);
			}
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
		const monthlyCreditLimit =
			this.aiCreditService.toCredits(monthlyTokenLimit);
		const usedCreditsInPeriod =
			this.aiCreditService.toCredits(usedTokensInPeriod);
		const remainingCreditsInPeriod = this.aiCreditService.toCredits(remaining);

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
					canUseAI: remaining > 0 || monthlyTokenLimit === 0,
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
			monthlyCreditLimit,
			usedCreditsInPeriod,
			remainingCreditsInPeriod,
			sampleConsumed,
			sampleGenerationCount,
			freemiumScope: {
				sampleCourseId,
				firstModuleId,
				firstLessonId,
			},
			capabilities,
		};

		if (!hasActiveSubscription && monthlyTokenLimit > 0 && remaining <= 0) {
			entitlements.primaryRestriction = {
				code: 'TOKEN_LIMIT_EXCEEDED',
				message:
					'Voce atingiu o limite de creditos do plano gratuito. Faca upgrade para continuar.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		if (hasActiveSubscription && monthlyTokenLimit > 0 && remaining <= 0) {
			entitlements.primaryRestriction = {
				code: 'TOKEN_LIMIT_EXCEEDED',
				message:
					'Seu limite mensal de creditos foi atingido. Faca upgrade para continuar.',
				upgradeRequired: true,
				nextStep: 'open_subscription_settings',
			};
		}

		return entitlements;
	}
}
