import { NotFoundException } from '@nestjs/common';
import { GetCurrentLegalDocumentUseCase } from './get-current-legal-document.usecase';
import type { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';

describe('GetCurrentLegalDocumentUseCase', () => {
	it('deve retornar o documento ativo atual', async () => {
		const legalRepository = {
			findCurrentDocument: jest.fn().mockResolvedValue({
				id: 'doc-1',
				documentType: 'terms_of_use',
				version: 'v1',
				title: 'Termo de Uso da Knowee',
				contentMarkdown:
					'Conteudo gerado com IA pode conter erros. O usuario deve revisar e validar a veracidade.',
				isActive: true,
				publishedAt: '2026-03-14T00:00:00.000Z',
			}),
		} as unknown as jest.Mocked<LegalRepositoryPort>;

		const useCase = new GetCurrentLegalDocumentUseCase(legalRepository);

		await expect(useCase.execute('terms_of_use')).resolves.toMatchObject({
			version: 'v1',
			title: 'Termo de Uso da Knowee',
		});
	});

	it('deve falhar quando nao houver documento ativo', async () => {
		const legalRepository = {
			findCurrentDocument: jest.fn().mockResolvedValue(null),
		} as unknown as jest.Mocked<LegalRepositoryPort>;

		const useCase = new GetCurrentLegalDocumentUseCase(legalRepository);

		await expect(useCase.execute('terms_of_use')).rejects.toThrow(
			NotFoundException
		);
	});
});
