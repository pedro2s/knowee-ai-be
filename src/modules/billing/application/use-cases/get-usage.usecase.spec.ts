import { NotFoundException } from '@nestjs/common';
import { GetUsageUseCase } from './get-usage.usecase';
import type { UsageRepositoryPort } from '../../domain/ports/usage-repository.port';

describe('GetUsageUseCase', () => {
	function build() {
		const usageRepository = {
			getLatestSubscriptionSnapshot: jest.fn(),
			getUsageInPeriod: jest.fn(),
		} as unknown as jest.Mocked<UsageRepositoryPort>;

		return {
			usageRepository,
			useCase: new GetUsageUseCase(usageRepository),
		};
	}

	afterEach(() => {
		jest.useRealTimers();
	});

	it('deve falhar quando nao houver snapshot de assinatura', async () => {
		const { useCase, usageRepository } = build();
		usageRepository.getLatestSubscriptionSnapshot.mockResolvedValue(null);

		await expect(useCase.execute('user-1')).rejects.toThrow(NotFoundException);
	});

	it('deve calcular o inicio do periodo para assinaturas ativas', async () => {
		jest.useFakeTimers().setSystemTime(new Date('2026-03-12T12:00:00.000Z'));
		const { useCase, usageRepository } = build();
		usageRepository.getLatestSubscriptionSnapshot.mockResolvedValue({
			id: 'sub-1',
			createdAt: '2026-01-15T10:00:00.000Z',
			status: 'active',
		});
		usageRepository.getUsageInPeriod.mockResolvedValue(88);

		await expect(useCase.execute('user-1')).resolves.toEqual({ used: 88 });
		expect(usageRepository.getUsageInPeriod).toHaveBeenCalledWith(
			'user-1',
			'sub-1',
			new Date('2026-02-15T03:00:00.000Z')
		);
	});

	it('deve usar a epoca para planos nao ativos', async () => {
		const { useCase, usageRepository } = build();
		usageRepository.getLatestSubscriptionSnapshot.mockResolvedValue({
			id: 'sub-1',
			createdAt: '2026-01-15T10:00:00.000Z',
			status: 'free',
		});
		usageRepository.getUsageInPeriod.mockResolvedValue(12);

		await useCase.execute('user-1');

		expect(usageRepository.getUsageInPeriod).toHaveBeenCalledWith(
			'user-1',
			'sub-1',
			new Date(0)
		);
	});
});
