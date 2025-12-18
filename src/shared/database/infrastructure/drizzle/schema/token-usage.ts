import {
	pgTable,
	serial,
	uuid,
	text,
	foreignKey,
	integer,
	timestamp,
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
		subscriptionId: uuid('subscription_id').notNull(),
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
	],
);
