import {
	pgTable,
	pgPolicy,
	uuid,
	text,
	foreignKey,
	timestamp,
	jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const courses = pgTable(
	'courses',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		title: text().notNull(),
		description: text(),
		category: text(),
		level: text(),
		duration: text(),
		targetAudience: text('target_audience'),
		objectives: text(),
		files: jsonb().default([]),
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
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'courses_user_id_fkey',
		}),
		pgPolicy('Users can view their own courses', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can create their own courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their own courses', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their own courses', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);
