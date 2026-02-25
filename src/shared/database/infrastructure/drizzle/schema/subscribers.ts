import {
	pgTable,
	pgPolicy,
	uuid,
	text,
	foreignKey,
	integer,
	timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { subscriptionTier } from './subscription-tier';

export const subscribers = pgTable(
	'subscribers',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id'),
		email: text().notNull(),
		stripeCustomerId: text('stripe_customer_id'),
		status: text().default('free').notNull(),
		subscriptionEnd: timestamp('subscription_end', {
			withTimezone: true,
			mode: 'string',
		}),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.defaultNow()
			.notNull(),
		subscriptionTierId: integer('subscription_tier_id').notNull(),
		stripeSubscriptionId: text('stripe_subscription_id'),
		sampleCourseId: uuid('sample_course_id'),
		sampleConsumedAt: timestamp('sample_consumed_at', {
			withTimezone: true,
			mode: 'string',
		}),
		sampleGenerationCount: integer('sample_generation_count')
			.default(0)
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.subscriptionTierId],
			foreignColumns: [subscriptionTier.id],
			name: 'subscribers_subscription_tier_id_fkey',
		}),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'subscribers_user_id_fkey',
		}).onDelete('cascade'),
		pgPolicy('select_own_subscription', {
			as: 'permissive',
			for: 'select',
			to: ['public'],
			using: sql`((user_id = auth.uid()) OR (email = auth.email()))`,
		}),
		pgPolicy('update_own_subscription', {
			as: 'permissive',
			for: 'update',
			to: ['public'],
		}),
		pgPolicy('insert_subscription', {
			as: 'permissive',
			for: 'insert',
			to: ['public'],
		}),
	]
);
