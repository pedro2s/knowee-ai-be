import { IsIn } from 'class-validator';
import type { LegalDocumentType } from '../../domain/entities/legal-document.types';

export class GetCurrentLegalDocumentQueryDto {
	@IsIn(['terms_of_use'])
	type: LegalDocumentType;
}
