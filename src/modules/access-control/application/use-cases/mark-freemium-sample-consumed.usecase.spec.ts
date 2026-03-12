import { MarkFreemiumSampleConsumedUseCase } from './mark-freemium-sample-consumed.usecase';
import type { AccessControlRepositoryPort } from '../../domain/ports/access-control.repository.port';
import type { GetUserEntitlementsUseCase } from './get-user-entitlements.usecase';

describe('MarkFreemiumSampleConsumedUseCase', () => {
	it('deve marcar consumo apenas para usuario free sem amostra consumida', async () => {
		const repository = {
			markSampleConsumed: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<AccessControlRepositoryPort>;
		const getUserEntitlementsUseCase = {
			execute: jest.fn().mockResolvedValue({
				hasActiveSubscription: false,
				sampleConsumed: false,
			}),
		} as unknown as jest.Mocked<GetUserEntitlementsUseCase>;

		const useCase = new MarkFreemiumSampleConsumedUseCase(
			repository,
			getUserEntitlementsUseCase
		);

		await useCase.execute('user-1', 'course-1');

		expect(repository.markSampleConsumed).toHaveBeenCalledWith(
			'user-1',
			'course-1'
		);
	});

	it('nao deve marcar quando usuario ja tiver assinatura ou amostra consumida', async () => {
		const repository = {
			markSampleConsumed: jest.fn(),
		} as unknown as jest.Mocked<AccessControlRepositoryPort>;
		const getUserEntitlementsUseCase = {
			execute: jest
				.fn()
				.mockResolvedValueOnce({
					hasActiveSubscription: true,
					sampleConsumed: false,
				})
				.mockResolvedValueOnce({
					hasActiveSubscription: false,
					sampleConsumed: true,
				}),
		} as unknown as jest.Mocked<GetUserEntitlementsUseCase>;

		const useCase = new MarkFreemiumSampleConsumedUseCase(
			repository,
			getUserEntitlementsUseCase
		);

		await useCase.execute('user-1', 'course-1');
		await useCase.execute('user-1', 'course-1');

		expect(repository.markSampleConsumed).not.toHaveBeenCalled();
	});
});
