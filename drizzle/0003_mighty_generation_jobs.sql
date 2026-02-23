CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"phase" text DEFAULT 'structure' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_user_id" ON "generation_jobs" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_generation_jobs_course_id" ON "generation_jobs" USING btree ("course_id");
--> statement-breakpoint
ALTER TABLE "generation_jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can view their own generation jobs" ON "generation_jobs" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = user_id));
--> statement-breakpoint
CREATE POLICY "Users can create their own generation jobs" ON "generation_jobs" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can update their own generation jobs" ON "generation_jobs" AS PERMISSIVE FOR UPDATE TO "public" USING (true) WITH CHECK (true);
