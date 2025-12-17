import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: varchar('title', { length: 256 }).notNull(),
	description: text('description'),
	category: varchar('category', { length: 20 }),
	level: varchar('level', { length: 20 }),
	duration: varchar('duration', { length: 20 }),
	targetAudience: text('target_audience'),
	userId: uuid('user_id').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
