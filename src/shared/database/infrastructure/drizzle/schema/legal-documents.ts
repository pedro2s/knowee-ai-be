import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const legalDocuments = pgTable('legal_documents', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentType: text('document_type').notNull(),
	version: text().notNull(),
	title: text().notNull(),
	contentMarkdown: text('content_markdown').notNull(),
	isActive: boolean('is_active').notNull().default(false),
	publishedAt: timestamp('published_at', {
		withTimezone: true,
		mode: 'string',
	})
		.defaultNow()
		.notNull(),
	createdAt: timestamp('created_at', {
		withTimezone: true,
		mode: 'string',
	})
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', {
		withTimezone: true,
		mode: 'string',
	})
		.defaultNow()
		.notNull(),
});
