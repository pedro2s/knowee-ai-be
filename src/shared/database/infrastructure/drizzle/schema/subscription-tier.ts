import {
	boolean,
	integer,
	jsonb,
	numeric,
	pgTable,
	serial,
	text,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

export const subscriptionTier = pgTable(
	'subscription_tier',
	{
		id: serial().primaryKey().notNull(),
		name: text().notNull(),
		displayName: text('display_name').notNull(),
		monthlyTokenLimit: integer('monthly_token_limit').notNull(),
		price: numeric({ precision: 8, scale: 2 }),
		billingPeriod: text('billing_period'),
		description: text(),
		features: jsonb().notNull().default([]),
		isHighlighted: boolean('is_highlighted').notNull().default(false),
		isContactOnly: boolean('is_contact_only').notNull().default(false),
		sortOrder: integer('sort_order').notNull().default(0),
		isPublic: boolean('is_public').notNull().default(true),
		supportChannel: text('support_channel').notNull().default('email'),
		supportSlaHours: integer('support_sla_hours').notNull().default(72),
		stripePriceId: text('stripe_price_id'),
		stripePriceIdAnnual: text('stripe_price_id_annual'),
		annualPrice: numeric('annual_price', { precision: 8, scale: 2 }),
	},
	(table) => [uniqueIndex('subscription_tier_name_uidx').on(table.name)]
);
