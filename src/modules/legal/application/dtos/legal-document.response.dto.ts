import { LegalDocument } from '../../domain/entities/legal-document.types';

export class LegalDocumentResponseDto {
	documentType: LegalDocument['documentType'];
	version: string;
	title: string;
	contentMarkdown: string;
	publishedAt: string;

	static fromDomain(input: LegalDocument): LegalDocumentResponseDto {
		return {
			documentType: input.documentType,
			version: input.version,
			title: input.title,
			contentMarkdown: input.contentMarkdown,
			publishedAt: input.publishedAt,
		};
	}
}
