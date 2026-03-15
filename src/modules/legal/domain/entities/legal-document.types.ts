export type LegalDocumentType = 'terms_of_use';

export type LegalAcceptanceSource = 'first_access_gate' | 'settings_review';

export interface LegalDocument {
	id: string;
	documentType: LegalDocumentType;
	version: string;
	title: string;
	contentMarkdown: string;
	isActive: boolean;
	publishedAt: string;
}

export interface LegalAcceptanceRecord {
	id: string;
	userId: string;
	documentId: string;
	documentType: LegalDocumentType;
	documentVersion: string;
	source: LegalAcceptanceSource;
	acceptedAt: string;
	userAgent: string | null;
	ipAddress: string | null;
}

export interface LegalAcceptanceStatus {
	documentType: LegalDocumentType;
	title: string;
	currentVersion: string;
	acceptedVersion: string | null;
	acceptedAt: string | null;
	pendingAcceptance: boolean;
}
