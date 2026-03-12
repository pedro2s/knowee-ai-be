import { AccessControlController } from './access-control.controller';
import type { GetUserEntitlementsUseCase } from '../../application/use-cases/get-user-entitlements.usecase';

describe('AccessControlController', () => {
	it('deve retornar os entitlements mapeados', async () => {
		const getUserEntitlementsUseCase = {
			execute: jest.fn().mockResolvedValue({
				planName: 'free',
				hasActiveSubscription: false,
				subscriptionId: null,
				monthlyTokenLimit: 10,
				usedTokensInPeriod: 2,
				remainingTokensInPeriod: 8,
				sampleConsumed: false,
				sampleGenerationCount: 0,
				freemiumScope: {
					sampleCourseId: null,
					firstModuleId: null,
					firstLessonId: null,
				},
				capabilities: {
					canCreateCourse: true,
					canAccessPlatform: true,
					canUseAI: true,
					canGenerateAssets: false,
					canExport: false,
				},
			}),
		} as unknown as jest.Mocked<GetUserEntitlementsUseCase>;
		const controller = new AccessControlController(getUserEntitlementsUseCase);

		await expect(
			controller.getEntitlements({ id: 'user-1' } as never)
		).resolves.toEqual({
			planName: 'free',
			hasActiveSubscription: false,
			subscriptionId: null,
			monthlyTokenLimit: 10,
			usedTokensInPeriod: 2,
			remainingTokensInPeriod: 8,
			sampleConsumed: false,
			sampleGenerationCount: 0,
			freemiumScope: {
				sampleCourseId: null,
				firstModuleId: null,
				firstLessonId: null,
			},
			capabilities: {
				canCreateCourse: true,
				canAccessPlatform: true,
				canUseAI: true,
				canGenerateAssets: false,
				canExport: false,
			},
			primaryRestriction: undefined,
		});
	});
});
