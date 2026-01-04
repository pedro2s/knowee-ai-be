import {
	pgTable,
	index,
	pgPolicy,
	serial,
	uuid,
	foreignKey,
	timestamp,
	jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courses } from './courses';

export const history = pgTable(
	'history',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		message: jsonb(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		courseId: uuid('course_id').notNull(),
	},
	(table) => [
		index('history_user_id_idx').using(
			'btree',
			table.userId.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'history_course_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Usuário pode ver seus próprios históricos', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		pgPolicy('Usuário pode inserir documentos seus próprios documentos', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can delete their own history', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);

export type SelectHistory = typeof history.$inferSelect;
export type InsertHistory = typeof history.$inferInsert;
