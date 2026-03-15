import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalAcceptanceSource } from '../../domain/entities/legal-document.types';
import { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';
import { GetMyLegalAcceptanceUseCase } from './get-my-legal-acceptance.usecase';

@Injectable()
export class AcceptCurrentLegalDocumentUseCase {
	constructor(
		private readonly legalRepository: LegalRepositoryPort,
		private readonly getMyLegalAcceptanceUseCase: GetMyLegalAcceptanceUseCase
	) {}

	async execute(input: {
		userId: string;
		documentType: 'terms_of_use';
		source: LegalAcceptanceSource;
		userAgent?: string | null;
		ipAddress?: string | null;
	}) {
		const document = await this.legalRepository.findCurrentDocument(
			input.documentType
		);

		if (!document) {
			throw new NotFoundException(
				'Nenhum documento legal ativo foi encontrado para este tipo.'
			);
		}

		await this.legalRepository.createAcceptance({
			userId: input.userId,
			documentId: document.id,
			documentType: document.documentType,
			documentVersion: document.version,
			source: input.source,
			userAgent: input.userAgent,
			ipAddress: input.ipAddress,
		});

		return this.getMyLegalAcceptanceUseCase.execute(
			input.userId,
			input.documentType
		);
	}
}
