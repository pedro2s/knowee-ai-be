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
import { courses } from './courses';

export const questionsAnswers = pgTable(
	'qa_history',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		courseId: uuid('course_id').notNull(),
		question: text().notNull(),
		answer: text().notNull(),
		createdAt: timestamp('created_at', {
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
			name: 'qa_history_course_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'qa_history_user_id_fkey',
		}),
		pgPolicy('Usuário pode ver seus próprios históricos', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(user_id = auth.uid())`,
		}),
		pgPolicy('Usuário pode inserir seus próprios historicos', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	]
);

export type SelectQuestionAnswer = typeof questionsAnswers.$inferSelect;
export type InsertQuestionAnswer = typeof questionsAnswers.$inferInsert;
