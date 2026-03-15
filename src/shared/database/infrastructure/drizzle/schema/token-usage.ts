import {
	pgTable,
	serial,
	uuid,
	text,
	foreignKey,
	integer,
	timestamp,
	numeric,
	jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { subscribers } from './subscribers';

export const tokenUsage = pgTable(
	'token_usage',
	{
		id: serial().primaryKey().notNull(),
		userId: uuid('user_id').notNull(),
		totalTokens: integer('total_tokens'),
		model: text().notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		subscriptionId: uuid('subscription_id'),
		provider: text().notNull().default('unknown'),
		operation: text().notNull().default('legacy'),
		modality: text().notNull().default('text'),
		unitType: text('unit_type').notNull().default('tokens'),
		totalUnits: integer('total_units').notNull().default(0),
		billableUnits: integer('billable_units').notNull().default(0),
		inputTokens: integer('input_tokens'),
		outputTokens: integer('output_tokens'),
		estimatedCostUsd: numeric('estimated_cost_usd', {
			precision: 12,
			scale: 6,
		}),
		courseId: uuid('course_id'),
		moduleId: uuid('module_id'),
		lessonId: uuid('lesson_id'),
		jobId: uuid('job_id'),
		subscriptionStatus: text('subscription_status').notNull().default('free'),
		planName: text('plan_name').notNull().default('free'),
		metadata: jsonb().notNull().default({}),
	},
	(table) => [
		foreignKey({
			columns: [table.subscriptionId],
			foreignColumns: [subscribers.id],
			name: 'token_usage_subscription_id_fkey',
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'token_usage_user_id_fkey',
		}),
	]
);
