import {
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
	jsonb,
} from 'drizzle-orm/pg-core';
import { modules } from './modules';

export const lessons = pgTable('lessons', {
	id: uuid('id').defaultRandom().primaryKey(),
	moduleId: uuid('module_id')
		.notNull()
		.references(() => modules.id, {
			onDelete: 'cascade',
		}),
	title: varchar('title', { length: 256 }).notNull(),
	description: text('description'),
	lessonType: varchar('lesson_type', { length: 20 }),
	content: jsonb('content').default('{}'),
	assets: jsonb('assets').default('[]'),
	orderIndex: integer('order_index').notNull(),
	duration: integer('duration'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
