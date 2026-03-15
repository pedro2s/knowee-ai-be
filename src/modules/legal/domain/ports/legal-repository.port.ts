import {
	LegalAcceptanceRecord,
	LegalAcceptanceSource,
	LegalDocument,
	LegalDocumentType,
} from '../entities/legal-document.types';

export abstract class LegalRepositoryPort {
	abstract findCurrentDocument(
		documentType: LegalDocumentType
	): Promise<LegalDocument | null>;

	abstract findLatestAcceptance(
		userId: string,
		documentType: LegalDocumentType
	): Promise<LegalAcceptanceRecord | null>;

	abstract createAcceptance(input: {
		userId: string;
		documentId: string;
		documentType: LegalDocumentType;
		documentVersion: string;
		source: LegalAcceptanceSource;
		userAgent?: string | null;
		ipAddress?: string | null;
	}): Promise<LegalAcceptanceRecord>;
}
