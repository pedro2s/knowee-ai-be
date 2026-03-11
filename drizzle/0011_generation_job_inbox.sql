ALTER TABLE "generation_jobs" ADD COLUMN "job_family" text DEFAULT 'course' NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "job_intent" text DEFAULT 'Gerando curso' NOT NULL;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "target_label" text;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "scope_course_id" uuid;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "scope_lesson_id" uuid;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "scope_section_id" text;--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_dedupe_key" ON "generation_jobs" USING btree ("dedupe_key");--> statement-breakpoint
