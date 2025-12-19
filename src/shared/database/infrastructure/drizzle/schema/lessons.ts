import {
	pgTable,
	index,
	pgPolicy,
	uuid,
	text,
	foreignKey,
	integer,
	timestamp,
	jsonb,
	boolean,
	check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { courses } from './courses';
import { modules } from './modules';

export const lessons = pgTable(
	'lessons',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		courseId: uuid('course_id').notNull(),
		moduleId: uuid('module_id').notNull(),
		title: text().notNull(),
		description: text(),
		lessonType: text('lesson_type').notNull(),
		content: jsonb().default({}),
		assets: jsonb().default([]),
		orderIndex: integer('order_index').default(1).notNull(),
		duration: integer(),
		isPublished: boolean('is_published').default(false),
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
		index('idx_lessons_course_id').using(
			'btree',
			table.courseId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_lessons_module_id').using(
			'btree',
			table.moduleId.asc().nullsLast().op('uuid_ops'),
		),
		index('idx_lessons_order').using(
			'btree',
			table.courseId.asc().nullsLast().op('int4_ops'),
			table.moduleId.asc().nullsLast().op('uuid_ops'),
			table.orderIndex.asc().nullsLast().op('uuid_ops'),
		),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'lessons_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'lessons_module_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('Users can view their own course lessons', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = lessons.course_id) AND (courses.user_id = auth.uid()))))`,
		}),
		pgPolicy('Users can create lessons for their courses', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their course lessons', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their course lessons', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
		}),
		check(
			'lessons_lesson_type_check',
			sql`lesson_type = ANY (ARRAY['video'::text, 'audio'::text, 'quiz'::text, 'pdf'::text, 'external'::text, 'article'::text])`,
		),
	],
);

export type SelectLesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;
