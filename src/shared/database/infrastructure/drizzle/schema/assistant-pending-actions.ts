import {
	foreignKey,
	index,
	jsonb,
	pgPolicy,
	pgTable,
	text,
	timestamp,
	uuid,
	check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { courses } from './courses';

export const assistantPendingActions = pgTable(
	'assistant_pending_actions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		courseId: uuid('course_id').notNull(),
		toolName: text('tool_name').notNull(),
		argumentsJson: jsonb('arguments_json').notNull(),
		status: text().notNull().default('pending'),
		proposedAnswer: text('proposed_answer').notNull(),
		executionResultSummary: text('execution_result_summary'),
		errorMessage: text('error_message'),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		confirmedAt: timestamp('confirmed_at', {
			withTimezone: true,
			mode: 'string',
		}),
		completedAt: timestamp('completed_at', {
			withTimezone: true,
			mode: 'string',
		}),
		expiresAt: timestamp('expires_at', {
			withTimezone: true,
			mode: 'string',
		}).notNull(),
	},
	(table) => [
		index('idx_assistant_pending_actions_user_course_status').using(
			'btree',
			table.userId.asc().nullsLast().op('uuid_ops'),
			table.courseId.asc().nullsLast().op('uuid_ops'),
			table.status.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'assistant_pending_actions_user_id_fkey',
		}),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'assistant_pending_actions_course_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('User can read own assistant pending actions', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		pgPolicy('User can insert own assistant pending actions', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('User can update own assistant pending actions', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		check(
			'assistant_pending_actions_status_check',
			sql`status = ANY (ARRAY['pending'::text, 'executed'::text, 'cancelled'::text, 'failed'::text, 'expired'::text])`
		),
	]
);

export type SelectAssistantPendingAction =
	typeof assistantPendingActions.$inferSelect;
export type InsertAssistantPendingAction =
	typeof assistantPendingActions.$inferInsert;
