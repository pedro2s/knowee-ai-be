import {
	foreignKey,
	index,
	jsonb,
	pgPolicy,
	pgTable,
	timestamp,
	uniqueIndex,
	uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { generationJobs } from './generation-jobs';

export const generationJobPayloads = pgTable(
	'generation_job_payloads',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		jobId: uuid('job_id').notNull(),
		userId: uuid('user_id').notNull(),
		payload: jsonb().notNull().default({}),
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
		index('idx_generation_job_payloads_job_id').on(table.jobId),
		index('idx_generation_job_payloads_user_id').on(table.userId),
		uniqueIndex('uq_generation_job_payloads_job_id').on(table.jobId),
		foreignKey({
			columns: [table.jobId],
			foreignColumns: [generationJobs.id],
			name: 'generation_job_payloads_job_id_fkey',
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'generation_job_payloads_user_id_fkey',
		}),
		pgPolicy('Users can view their own generation job payloads', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
		pgPolicy('Users can create their own generation job payloads', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
		pgPolicy('Users can update their own generation job payloads', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('Users can delete their own generation job payloads', {
			as: 'permissive',
			for: 'delete',
			to: ['public'],
			using: sql`(auth.uid() = user_id)`,
		}),
	]
);

export type SelectGenerationJobPayload =
	typeof generationJobPayloads.$inferSelect;
export type InsertGenerationJobPayload =
	typeof generationJobPayloads.$inferInsert;
