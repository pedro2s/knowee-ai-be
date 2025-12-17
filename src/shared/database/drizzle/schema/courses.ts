import {
	pgTable,
	uuid,
	varchar,
	text,
	jsonb,
	timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

export const courses = pgTable('courses', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, {
			onDelete: 'cascade',
		}),
	title: varchar('title', { length: 256 }).notNull(),
	description: text('description'),
	category: varchar('category', { length: 30 }),
	level: varchar('level', { length: 20 }),
	duration: varchar('duration', { length: 20 }),
	targetAudience: text('target_audience'),
	objectives: text('objectives'),
	files: jsonb().default('[]'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
