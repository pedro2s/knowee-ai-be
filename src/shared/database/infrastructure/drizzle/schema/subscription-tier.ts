import { pgTable, serial, text, integer, numeric } from 'drizzle-orm/pg-core';

export const subscriptionTier = pgTable('subscription_tier', {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	monthlyTokenLimit: integer('monthly_token_limit').notNull(),
	price: numeric({ precision: 8, scale: 2 }),
	stripePriceId: text('stripe_price_id'),
});
