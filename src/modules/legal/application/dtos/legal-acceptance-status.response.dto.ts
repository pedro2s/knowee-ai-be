import { LegalAcceptanceStatus } from '../../domain/entities/legal-document.types';

export class LegalAcceptanceStatusResponseDto {
	documentType: LegalAcceptanceStatus['documentType'];
	title: string;
	currentVersion: string;
	acceptedVersion: string | null;
	acceptedAt: string | null;
	pendingAcceptance: boolean;

	static fromDomain(
		input: LegalAcceptanceStatus
	): LegalAcceptanceStatusResponseDto {
		return {
			documentType: input.documentType,
			title: input.title,
			currentVersion: input.currentVersion,
			acceptedVersion: input.acceptedVersion,
			acceptedAt: input.acceptedAt,
			pendingAcceptance: input.pendingAcceptance,
		};
	}
}
