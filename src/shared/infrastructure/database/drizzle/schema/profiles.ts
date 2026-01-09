import {
	pgTable,
	pgPolicy,
	uuid,
	text,
	foreignKey,
	timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const profiles = pgTable(
	'profiles',
	{
		id: uuid().primaryKey().notNull(),
		email: text(),
		fullName: text('full_name'),
		avatarUrl: text('avatar_url'),
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
		phone: text(),
		company: text(),
		bio: text(),
	},
	(table) => [
		foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: 'profiles_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own profile', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = id)`,
		}),
		pgPolicy('Users can update their own profile', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can insert their own profile', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	]
);
