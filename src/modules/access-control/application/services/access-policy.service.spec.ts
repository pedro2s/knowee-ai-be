import { AccessPolicyService } from './access-policy.service';

describe('AccessPolicyService', () => {
	const service = new AccessPolicyService();

	const baseEntitlements = {
		planName: 'free',
		hasActiveSubscription: false,
		subscriptionId: null,
		monthlyTokenLimit: 10,
		usedTokensInPeriod: 0,
		remainingTokensInPeriod: 10,
		sampleConsumed: false,
		sampleGenerationCount: 0,
		freemiumScope: {
			sampleCourseId: 'course-1',
			firstModuleId: 'module-1',
			firstLessonId: 'lesson-1',
		},
		capabilities: {
			canCreateCourse: true,
			canAccessPlatform: true,
			canUseAI: true,
			canGenerateAssets: false,
			canExport: false,
		},
	} as const;

	it('deve permitir tudo para assinante ativo com tokens disponiveis', () => {
		expect(
			service.decide(
				'assets.generate',
				{
					...baseEntitlements,
					hasActiveSubscription: true,
				},
				{ courseId: 'course-1' }
			)
		).toEqual({ allowed: true });
	});

	it('deve bloquear IA para assinante ativo sem tokens', () => {
		expect(
			service.decide(
				'ai.interaction',
				{
					...baseEntitlements,
					hasActiveSubscription: true,
					remainingTokensInPeriod: 0,
				},
				{ courseId: 'course-1' }
			)
		).toMatchObject({
			allowed: false,
			reasonCode: 'TOKEN_LIMIT_EXCEEDED',
		});
	});

	it('deve bloquear criacao manual e export no plano free', () => {
		expect(
			service.decide('course.create_manual', baseEntitlements, {})
		).toMatchObject({
			allowed: false,
			reasonCode: 'SUBSCRIPTION_REQUIRED',
		});
		expect(
			service.decide('course.export_scorm', baseEntitlements, {})
		).toMatchObject({
			allowed: false,
			reasonCode: 'SUBSCRIPTION_REQUIRED',
		});
	});

	it('deve restringir IA fora do curso de amostra no plano free', () => {
		expect(
			service.decide('ai.interaction', baseEntitlements, {
				courseId: 'course-2',
			})
		).toMatchObject({
			allowed: false,
			reasonCode: 'FREEMIUM_SCOPE_RESTRICTED',
		});
	});

	it('deve exigir contexto para acoes escopadas ao curso', () => {
		expect(service.decide('course.read', baseEntitlements, {})).toMatchObject({
			allowed: false,
			reasonCode: 'RESOURCE_CONTEXT_REQUIRED',
		});
	});
});
