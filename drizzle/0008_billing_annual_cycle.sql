ALTER TABLE "subscription_tier"
	ADD COLUMN "stripe_price_id_annual" text,
	ADD COLUMN "annual_price" numeric(8, 2);
