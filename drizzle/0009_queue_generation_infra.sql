ALTER TABLE "generation_jobs" ADD COLUMN "job_type" text DEFAULT 'course_generation' NOT NULL;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "queue_name" text DEFAULT 'generation' NOT NULL;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "queue_job_id" text;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "max_attempts" integer DEFAULT 3 NOT NULL;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN "heartbeat_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_queue_job_id" ON "generation_jobs" USING btree ("queue_job_id");
--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_status_updated_at" ON "generation_jobs" USING btree ("status","updated_at");
--> statement-breakpoint
CREATE TABLE "generation_job_payloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_job_payloads" ADD CONSTRAINT "generation_job_payloads_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "generation_job_payloads" ADD CONSTRAINT "generation_job_payloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_generation_job_payloads_job_id" ON "generation_job_payloads" USING btree ("job_id");
--> statement-breakpoint
CREATE INDEX "idx_generation_job_payloads_user_id" ON "generation_job_payloads" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_generation_job_payloads_job_id" ON "generation_job_payloads" USING btree ("job_id");
--> statement-breakpoint
ALTER TABLE "generation_job_payloads" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can view their own generation job payloads" ON "generation_job_payloads" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = user_id));
--> statement-breakpoint
CREATE POLICY "Users can create their own generation job payloads" ON "generation_job_payloads" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can update their own generation job payloads" ON "generation_job_payloads" AS PERMISSIVE FOR UPDATE TO "public" USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can delete their own generation job payloads" ON "generation_job_payloads" AS PERMISSIVE FOR DELETE TO "public" USING ((auth.uid() = user_id));
