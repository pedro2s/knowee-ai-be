import { AcceptCurrentLegalDocumentUseCase } from './accept-current-legal-document.usecase';
import { GetMyLegalAcceptanceUseCase } from './get-my-legal-acceptance.usecase';
import type { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';

describe('AcceptCurrentLegalDocumentUseCase', () => {
	it('deve registrar o aceite e retornar o status atualizado', async () => {
		const legalRepository = {
			findCurrentDocument: jest.fn().mockResolvedValue({
				id: 'doc-1',
				documentType: 'terms_of_use',
				version: 'v1',
				title: 'Termo de Uso da Knowee',
			}),
			createAcceptance: jest.fn().mockResolvedValue({
				id: 'acc-1',
			}),
			findLatestAcceptance: jest.fn().mockResolvedValue({
				id: 'acc-1',
				documentVersion: 'v1',
				acceptedAt: '2026-03-14T10:00:00.000Z',
			}),
		} as unknown as jest.Mocked<LegalRepositoryPort>;

		const getMyLegalAcceptanceUseCase = new GetMyLegalAcceptanceUseCase(
			legalRepository
		);
		const useCase = new AcceptCurrentLegalDocumentUseCase(
			legalRepository,
			getMyLegalAcceptanceUseCase
		);

		await expect(
			useCase.execute({
				userId: 'user-1',
				documentType: 'terms_of_use',
				source: 'first_access_gate',
				userAgent: 'jest',
				ipAddress: '127.0.0.1',
			})
		).resolves.toEqual({
			documentType: 'terms_of_use',
			title: 'Termo de Uso da Knowee',
			currentVersion: 'v1',
			acceptedVersion: 'v1',
			acceptedAt: '2026-03-14T10:00:00.000Z',
			pendingAcceptance: false,
		});

		expect(legalRepository.createAcceptance).toHaveBeenCalledWith({
			userId: 'user-1',
			documentId: 'doc-1',
			documentType: 'terms_of_use',
			documentVersion: 'v1',
			source: 'first_access_gate',
			userAgent: 'jest',
			ipAddress: '127.0.0.1',
		});
	});
});
