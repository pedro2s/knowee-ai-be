import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	index,
	foreignKey,
	pgPolicy,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courses } from './courses';

export const modules = pgTable(
	'modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		title: text().notNull(),
		description: text(),
		orderIndex: integer('order_index').default(1).notNull(),
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
		index('idx_modules_course_id').using(
			'btree',
			table.courseId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_modules_order').using(
			'btree',
			table.courseId.asc().nullsLast().op('int4_ops'),
			table.orderIndex.asc().nullsLast().op('int4_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'modules_course_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own course modules', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.user_id = auth.uid()))))`,
		}),
		pgPolicy('Users can create modules for their courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their course modules', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their course modules', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
	],
);

export type SelectModule = typeof modules.$inferSelect;
export type InsertModule = typeof modules.$inferInsert;
