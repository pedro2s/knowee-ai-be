import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	integer,
} from 'drizzle-orm/pg-core';
import { courses } from './courses';

export const modules = pgTable('modules', {
	id: uuid('id').defaultRandom().primaryKey(),
	courseId: uuid('course_id')
		.notNull()
		.references(() => courses.id, {
			onDelete: 'cascade',
		}),
	title: varchar('title', { length: 256 }).notNull(),
	description: text('description'),
	orderIndex: integer('order_index').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
