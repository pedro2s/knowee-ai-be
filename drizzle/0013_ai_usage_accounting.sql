ALTER TABLE "token_usage" ALTER COLUMN "subscription_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "provider" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "operation" text DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "modality" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "unit_type" text DEFAULT 'tokens' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "total_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "billable_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "input_tokens" integer;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "output_tokens" integer;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "estimated_cost_usd" numeric(12, 6);--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "module_id" uuid;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "job_id" uuid;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "subscription_status" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "plan_name" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "token_usage" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "token_usage"
SET
	"provider" = COALESCE("provider", 'legacy'),
	"operation" = COALESCE("operation", 'legacy'),
	"modality" = COALESCE("modality", 'text'),
	"unit_type" = COALESCE("unit_type", 'tokens'),
	"total_units" = COALESCE("total_units", "total_tokens", 0),
	"billable_units" = COALESCE("billable_units", "total_tokens", 0),
	"subscription_status" = COALESCE("subscription_status", 'free'),
	"plan_name" = COALESCE("plan_name", 'free'),
	"metadata" = COALESCE("metadata", '{}'::jsonb);--> statement-breakpoint
