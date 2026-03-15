import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocumentType } from '../../domain/entities/legal-document.types';
import { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';

@Injectable()
export class GetCurrentLegalDocumentUseCase {
	constructor(private readonly legalRepository: LegalRepositoryPort) {}

	async execute(documentType: LegalDocumentType) {
		const document =
			await this.legalRepository.findCurrentDocument(documentType);

		if (!document) {
			throw new NotFoundException(
				'Nenhum documento legal ativo foi encontrado para este tipo.'
			);
		}

		return document;
	}
}
