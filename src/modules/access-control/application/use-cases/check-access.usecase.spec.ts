import { CheckAccessUseCase } from './check-access.usecase';
import type { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';
import type { AccessPolicyService } from '../services/access-policy.service';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';

describe('CheckAccessUseCase', () => {
	function build() {
		const getUserEntitlementsUseCase = {
			execute: jest.fn().mockResolvedValue({
				planName: 'free',
				hasActiveSubscription: false,
			}),
		} as unknown as jest.Mocked<GetUserEntitlementsUseCase>;
		const policyService = {
			decide: jest.fn().mockReturnValue({ allowed: true }),
		} as unknown as jest.Mocked<AccessPolicyService>;
		const repository = {
			getCourseIdByModuleId: jest.fn(),
			getLessonScopeByLessonId: jest.fn(),
		} as unknown as jest.Mocked<AccessControlRepositoryPort>;

		return {
			getUserEntitlementsUseCase,
			policyService,
			repository,
			useCase: new CheckAccessUseCase(
				getUserEntitlementsUseCase,
				policyService,
				repository
			),
		};
	}

	it('deve normalizar courseId a partir do moduleId', async () => {
		const { useCase, repository, policyService } = build();
		repository.getCourseIdByModuleId.mockResolvedValue('course-1');

		await expect(
			useCase.execute({
				userId: 'user-1',
				action: 'module.read',
				context: { moduleId: 'module-1' },
			})
		).resolves.toEqual({ allowed: true });
		expect(repository.getCourseIdByModuleId).toHaveBeenCalledWith(
			'module-1',
			'user-1'
		);
		expect(policyService.decide).toHaveBeenCalledWith(
			'module.read',
			expect.anything(),
			{
				courseId: 'course-1',
				moduleId: 'module-1',
				lessonId: undefined,
			}
		);
	});

	it('deve normalizar moduleId e courseId a partir do lessonId', async () => {
		const { useCase, repository, policyService } = build();
		repository.getLessonScopeByLessonId.mockResolvedValue({
			moduleId: 'module-1',
			courseId: 'course-1',
		});

		await useCase.execute({
			userId: 'user-1',
			action: 'lesson.read',
			context: { lessonId: 'lesson-1' },
		});

		expect(policyService.decide).toHaveBeenCalledWith(
			'lesson.read',
			expect.anything(),
			{
				courseId: 'course-1',
				moduleId: 'module-1',
				lessonId: 'lesson-1',
			}
		);
	});
});
