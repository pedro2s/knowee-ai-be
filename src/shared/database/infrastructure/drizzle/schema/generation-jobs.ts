import {
	pgTable,
	pgPolicy,
	uuid,
	text,
	integer,
	jsonb,
	timestamp,
	foreignKey,
	index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { courses } from './courses';

export const generationJobs = pgTable(
	'generation_jobs',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		courseId: uuid('course_id'),
		status: text().notNull().default('pending'),
		jobType: text('job_type').notNull().default('course_generation'),
		phase: text().notNull().default('structure'),
		progress: integer().notNull().default(0),
		queueName: text('queue_name').notNull().default('generation'),
		queueJobId: text('queue_job_id'),
		attempts: integer().notNull().default(0),
		maxAttempts: integer('max_attempts').notNull().default(3),
		metadata: jsonb().notNull().default({}),
		error: text(),
		startedAt: timestamp('started_at', {
			withTimezone: true,
			mode: 'string',
		}),
		heartbeatAt: timestamp('heartbeat_at', {
			withTimezone: true,
			mode: 'string',
		}),
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
		completedAt: timestamp('completed_at', {
			withTimezone: true,
			mode: 'string',
		}),
	},
	(table) => [
		index('idx_generation_jobs_user_id').on(table.userId),
		index('idx_generation_jobs_course_id').on(table.courseId),
		index('idx_generation_jobs_queue_job_id').on(table.queueJobId),
		index('idx_generation_jobs_status_updated_at').on(
			table.status,
			table.updatedAt
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'generation_jobs_user_id_fkey',
		}),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: 'generation_jobs_course_id_fkey',
		}).onDelete('set null'),
		pgPolicy('Users can view their own generation jobs', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can create their own generation jobs', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their own generation jobs', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
	]
);

export type SelectGenerationJob = typeof generationJobs.$inferSelect;
export type InsertGenerationJob = typeof generationJobs.$inferInsert;
