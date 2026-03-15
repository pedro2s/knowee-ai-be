import { GetMyLegalAcceptanceUseCase } from './get-my-legal-acceptance.usecase';
import type { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';

describe('GetMyLegalAcceptanceUseCase', () => {
	it('deve marcar aceite pendente quando nao houver registro do usuario', async () => {
		const legalRepository = {
			findCurrentDocument: jest.fn().mockResolvedValue({
				id: 'doc-1',
				documentType: 'terms_of_use',
				version: 'v1',
				title: 'Termo de Uso da Knowee',
			}),
			findLatestAcceptance: jest.fn().mockResolvedValue(null),
		} as unknown as jest.Mocked<LegalRepositoryPort>;

		const useCase = new GetMyLegalAcceptanceUseCase(legalRepository);

		await expect(useCase.execute('user-1', 'terms_of_use')).resolves.toEqual({
			documentType: 'terms_of_use',
			title: 'Termo de Uso da Knowee',
			currentVersion: 'v1',
			acceptedVersion: null,
			acceptedAt: null,
			pendingAcceptance: true,
		});
	});

	it('deve liberar quando a versao aceita for a atual', async () => {
		const legalRepository = {
			findCurrentDocument: jest.fn().mockResolvedValue({
				id: 'doc-1',
				documentType: 'terms_of_use',
				version: 'v1',
				title: 'Termo de Uso da Knowee',
			}),
			findLatestAcceptance: jest.fn().mockResolvedValue({
				id: 'acc-1',
				documentVersion: 'v1',
				acceptedAt: '2026-03-14T10:00:00.000Z',
			}),
		} as unknown as jest.Mocked<LegalRepositoryPort>;

		const useCase = new GetMyLegalAcceptanceUseCase(legalRepository);

		await expect(useCase.execute('user-1', 'terms_of_use')).resolves.toEqual({
			documentType: 'terms_of_use',
			title: 'Termo de Uso da Knowee',
			currentVersion: 'v1',
			acceptedVersion: 'v1',
			acceptedAt: '2026-03-14T10:00:00.000Z',
			pendingAcceptance: false,
		});
	});
});
