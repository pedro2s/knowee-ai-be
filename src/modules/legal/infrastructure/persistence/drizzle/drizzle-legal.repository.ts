import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { LegalRepositoryPort } from 'src/modules/legal/domain/ports/legal-repository.port';
import { DrizzleService } from 'src/shared/database/infrastructure/drizzle/drizzle.service';
import {
	legalAcceptances,
	legalDocuments,
} from 'src/shared/database/infrastructure/drizzle/schema';

@Injectable()
export class DrizzleLegalRepository implements LegalRepositoryPort {
	constructor(private readonly drizzle: DrizzleService) {}

	async findCurrentDocument(documentType: 'terms_of_use') {
		const document = await this.drizzle.db.query.legalDocuments.findFirst({
			where: and(
				eq(legalDocuments.documentType, documentType),
				eq(legalDocuments.isActive, true)
			),
			orderBy: [desc(legalDocuments.publishedAt)],
		});

		if (!document) {
			return null;
		}

		return {
			id: document.id,
			documentType: document.documentType as 'terms_of_use',
			version: document.version,
			title: document.title,
			contentMarkdown: document.contentMarkdown,
			isActive: document.isActive,
			publishedAt: document.publishedAt,
		};
	}

	async findLatestAcceptance(userId: string, documentType: 'terms_of_use') {
		const acceptance = await this.drizzle.db.query.legalAcceptances.findFirst({
			where: and(
				eq(legalAcceptances.userId, userId),
				eq(legalAcceptances.documentType, documentType)
			),
			orderBy: [desc(legalAcceptances.acceptedAt)],
		});

		if (!acceptance) {
			return null;
		}

		return {
			id: acceptance.id,
			userId: acceptance.userId,
			documentId: acceptance.documentId,
			documentType: acceptance.documentType as 'terms_of_use',
			documentVersion: acceptance.documentVersion,
			source: acceptance.source as 'first_access_gate' | 'settings_review',
			acceptedAt: acceptance.acceptedAt,
			userAgent: acceptance.userAgent,
			ipAddress: acceptance.ipAddress,
		};
	}

	async createAcceptance(input: {
		userId: string;
		documentId: string;
		documentType: 'terms_of_use';
		documentVersion: string;
		source: 'first_access_gate' | 'settings_review';
		userAgent?: string | null;
		ipAddress?: string | null;
	}) {
		const [acceptance] = await this.drizzle.db
			.insert(legalAcceptances)
			.values({
				userId: input.userId,
				documentId: input.documentId,
				documentType: input.documentType,
				documentVersion: input.documentVersion,
				source: input.source,
				userAgent: input.userAgent ?? null,
				ipAddress: input.ipAddress ?? null,
			})
			.returning();

		return {
			id: acceptance.id,
			userId: acceptance.userId,
			documentId: acceptance.documentId,
			documentType: acceptance.documentType as 'terms_of_use',
			documentVersion: acceptance.documentVersion,
			source: acceptance.source as 'first_access_gate' | 'settings_review',
			acceptedAt: acceptance.acceptedAt,
			userAgent: acceptance.userAgent,
			ipAddress: acceptance.ipAddress,
		};
	}
}
