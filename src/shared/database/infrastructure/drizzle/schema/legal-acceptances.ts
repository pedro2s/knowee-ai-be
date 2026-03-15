import {
	foreignKey,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { legalDocuments } from './legal-documents';

export const legalAcceptances = pgTable(
	'legal_acceptances',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		documentId: uuid('document_id').notNull(),
		documentType: text('document_type').notNull(),
		documentVersion: text('document_version').notNull(),
		source: text().notNull(),
		userAgent: text('user_agent'),
		ipAddress: text('ip_address'),
		acceptedAt: timestamp('accepted_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'legal_acceptances_user_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.documentId],
			foreignColumns: [legalDocuments.id],
			name: 'legal_acceptances_document_id_fkey',
		}).onDelete('cascade'),
	]
);
