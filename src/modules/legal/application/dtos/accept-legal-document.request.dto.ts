import { IsIn, IsOptional } from 'class-validator';
import type {
	LegalAcceptanceSource,
	LegalDocumentType,
} from '../../domain/entities/legal-document.types';

export class AcceptLegalDocumentRequestDto {
	@IsIn(['terms_of_use'])
	documentType: LegalDocumentType;

	@IsOptional()
	@IsIn(['first_access_gate', 'settings_review'])
	source?: LegalAcceptanceSource;
}
