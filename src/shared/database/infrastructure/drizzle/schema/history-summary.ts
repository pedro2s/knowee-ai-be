import {
	pgTable,
	uuid,
	text,
	foreignKey,
	timestamp,
	primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { courses } from './courses';

export const historySummary = pgTable(
	'history_summary',
	{
		userId: uuid('user_id').notNull(),
		courseId: uuid('course_id').notNull(),
		summary: text().default('').notNull(),
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
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'history_summary_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'history_summary_user_id_fkey',
		}).onDelete('cascade'),
		primaryKey({
			columns: [table.userId, table.courseId],
			name: 'history_summary_pkey',
		}),
	],
);

export type SelectHistorySummary = typeof historySummary.$inferSelect;
export type InsertHistorySummary = typeof historySummary.$inferInsert;
