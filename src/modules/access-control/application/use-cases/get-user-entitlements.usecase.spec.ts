import { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';
import { AICreditService } from 'src/shared/token-usage/infrastructure/ai-credit.service';

describe('GetUserEntitlementsUseCase', () => {
	function build() {
		const repository = {
			getLatestSubscriber: jest.fn(),
			getUsageInPeriod: jest.fn(),
			countUserCourses: jest.fn(),
			getFirstCourseId: jest.fn(),
			getFirstModuleId: jest.fn(),
			getFirstLessonId: jest.fn(),
		} as unknown as jest.Mocked<AccessControlRepositoryPort>;

		return {
			repository,
			useCase: new GetUserEntitlementsUseCase(
				repository,
				new AICreditService()
			),
		};
	}

	afterEach(() => {
		jest.useRealTimers();
	});

	it('deve calcular entitlements de assinante ativo com janela mensal', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-03-12T12:00:00.000Z'));
		const { useCase, repository } = build();
		repository.getLatestSubscriber.mockResolvedValue({
			id: 'sub-1',
			status: 'active',
			tierName: 'premium',
			monthlyTokenLimit: 100,
			createdAt: '2026-01-15T10:00:00.000Z',
			sampleCourseId: 'course-1',
			sampleGenerationCount: 1,
		} as never);
		repository.getUsageInPeriod.mockResolvedValue(25);
		repository.getFirstModuleId.mockResolvedValue('module-1');
		repository.getFirstLessonId.mockResolvedValue('lesson-1');

		await expect(useCase.execute('user-1')).resolves.toEqual({
			planName: 'premium',
			hasActiveSubscription: true,
			subscriptionId: 'sub-1',
			monthlyTokenLimit: 100,
			usedTokensInPeriod: 25,
			remainingTokensInPeriod: 75,
			monthlyCreditLimit: 1,
			usedCreditsInPeriod: 1,
			remainingCreditsInPeriod: 1,
			sampleConsumed: true,
			sampleGenerationCount: 1,
			freemiumScope: {
				sampleCourseId: 'course-1',
				firstModuleId: 'module-1',
				firstLessonId: 'lesson-1',
			},
			capabilities: {
				canCreateCourse: true,
				canAccessPlatform: true,
				canUseAI: true,
				canGenerateAssets: true,
				canExport: true,
			},
		});
		expect(repository.getUsageInPeriod).toHaveBeenCalledWith(
			'user-1',
			'sub-1',
			'2026-02-15T03:00:00.000Z'
		);
	});

	it('deve inferir consumo de amostra quando nao houver sampleCourseId', async () => {
		const { useCase, repository } = build();
		repository.getLatestSubscriber.mockResolvedValue({
			id: 'sub-free',
			status: 'free',
			tierName: 'free',
			monthlyTokenLimit: 0,
			createdAt: '2026-01-01T00:00:00.000Z',
			sampleCourseId: null,
			sampleGenerationCount: 0,
		} as never);
		repository.countUserCourses.mockResolvedValue(1);
		repository.getFirstCourseId.mockResolvedValue('course-1');
		repository.getFirstModuleId.mockResolvedValue('module-1');
		repository.getFirstLessonId.mockResolvedValue('lesson-1');

		const result = await useCase.execute('user-1');

		expect(result.sampleConsumed).toBe(true);
		expect(result.sampleGenerationCount).toBe(1);
		expect(result.freemiumScope).toEqual({
			sampleCourseId: 'course-1',
			firstModuleId: 'module-1',
			firstLessonId: 'lesson-1',
		});
		expect(result.capabilities.canCreateCourse).toBe(false);
	});

	it('deve retornar restricao primaria quando os tokens acabarem', async () => {
		const { useCase, repository } = build();
		repository.getLatestSubscriber.mockResolvedValue({
			id: 'sub-free',
			status: 'free',
			tierName: 'free',
			monthlyTokenLimit: 10,
			createdAt: '2026-01-01T00:00:00.000Z',
			sampleCourseId: null,
			sampleGenerationCount: 0,
		} as never);
		repository.getUsageInPeriod.mockResolvedValue(10);
		repository.countUserCourses.mockResolvedValue(0);

		const result = await useCase.execute('user-1');

		expect(result.remainingTokensInPeriod).toBe(0);
		expect(result.remainingCreditsInPeriod).toBe(0);
		expect(result.primaryRestriction).toEqual({
			code: 'TOKEN_LIMIT_EXCEEDED',
			message:
				'Voce atingiu o limite de creditos do plano gratuito. Faca upgrade para continuar.',
			upgradeRequired: true,
			nextStep: 'open_subscription_settings',
		});
	});
});
