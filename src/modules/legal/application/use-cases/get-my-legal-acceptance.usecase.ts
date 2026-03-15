import { Injectable, NotFoundException } from '@nestjs/common';
import {
	LegalAcceptanceStatus,
	LegalDocumentType,
} from '../../domain/entities/legal-document.types';
import { LegalRepositoryPort } from '../../domain/ports/legal-repository.port';

@Injectable()
export class GetMyLegalAcceptanceUseCase {
	constructor(private readonly legalRepository: LegalRepositoryPort) {}

	async execute(
		userId: string,
		documentType: LegalDocumentType
	): Promise<LegalAcceptanceStatus> {
		const document =
			await this.legalRepository.findCurrentDocument(documentType);

		if (!document) {
			throw new NotFoundException(
				'Nenhum documento legal ativo foi encontrado para este tipo.'
			);
		}

		const latestAcceptance = await this.legalRepository.findLatestAcceptance(
			userId,
			documentType
		);

		return {
			documentType,
			title: document.title,
			currentVersion: document.version,
			acceptedVersion: latestAcceptance?.documentVersion ?? null,
			acceptedAt: latestAcceptance?.acceptedAt ?? null,
			pendingAcceptance: latestAcceptance?.documentVersion !== document.version,
		};
	}
}
