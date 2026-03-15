import { LegalController } from './legal.controller';
import type { AcceptCurrentLegalDocumentUseCase } from '../../application/use-cases/accept-current-legal-document.usecase';
import type { GetCurrentLegalDocumentUseCase } from '../../application/use-cases/get-current-legal-document.usecase';
import type { GetMyLegalAcceptanceUseCase } from '../../application/use-cases/get-my-legal-acceptance.usecase';

describe('LegalController', () => {
	it('deve delegar leitura do documento, status e aceite', async () => {
		const getCurrentLegalDocumentUseCase = {
			execute: jest.fn().mockResolvedValue({ version: 'v1', title: 'Termo' }),
		} as unknown as jest.Mocked<GetCurrentLegalDocumentUseCase>;
		const getMyLegalAcceptanceUseCase = {
			execute: jest.fn().mockResolvedValue({
				documentType: 'terms_of_use',
				title: 'Termo',
				currentVersion: 'v1',
				acceptedVersion: null,
				acceptedAt: null,
				pendingAcceptance: true,
			}),
		} as unknown as jest.Mocked<GetMyLegalAcceptanceUseCase>;
		const acceptCurrentLegalDocumentUseCase = {
			execute: jest.fn().mockResolvedValue({
				documentType: 'terms_of_use',
				title: 'Termo',
				currentVersion: 'v1',
				acceptedVersion: 'v1',
				acceptedAt: '2026-03-14T10:00:00.000Z',
				pendingAcceptance: false,
			}),
		} as unknown as jest.Mocked<AcceptCurrentLegalDocumentUseCase>;

		const controller = new LegalController(
			getCurrentLegalDocumentUseCase,
			getMyLegalAcceptanceUseCase,
			acceptCurrentLegalDocumentUseCase
		);

		await expect(
			controller.getCurrentDocument({ type: 'terms_of_use' })
		).resolves.toEqual({
			documentType: undefined,
			version: 'v1',
			title: 'Termo',
			contentMarkdown: undefined,
			publishedAt: undefined,
		});
		await expect(
			controller.getMyAcceptance({ id: 'user-1' } as never)
		).resolves.toEqual({
			documentType: 'terms_of_use',
			title: 'Termo',
			currentVersion: 'v1',
			acceptedVersion: null,
			acceptedAt: null,
			pendingAcceptance: true,
		});
		await expect(
			controller.acceptCurrentDocument(
				{ id: 'user-1' } as never,
				{ documentType: 'terms_of_use', source: 'first_access_gate' },
				{
					headers: { 'user-agent': 'jest' },
					ip: '127.0.0.1',
				} as never
			)
		).resolves.toEqual({
			documentType: 'terms_of_use',
			title: 'Termo',
			currentVersion: 'v1',
			acceptedVersion: 'v1',
			acceptedAt: '2026-03-14T10:00:00.000Z',
			pendingAcceptance: false,
		});
	});
});
