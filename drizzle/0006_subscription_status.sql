ALTER TABLE "subscribers" ADD COLUMN "status" text DEFAULT 'free' NOT NULL;

UPDATE "subscribers"
SET "status" = 'active'
WHERE "subscribed" = true;

UPDATE "subscribers"
SET "status" = 'canceled'
WHERE "status" = 'free'
  AND "subscription_end" IS NOT NULL;

ALTER TABLE "subscribers" DROP COLUMN "subscribed";