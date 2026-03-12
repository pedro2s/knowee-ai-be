CREATE TABLE "assistant_pending_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"arguments_json" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"proposed_answer" text NOT NULL,
	"execution_result_summary" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "assistant_pending_actions_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'executed'::text, 'cancelled'::text, 'failed'::text, 'expired'::text]))
);--> statement-breakpoint
ALTER TABLE "assistant_pending_actions" ADD CONSTRAINT "assistant_pending_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_pending_actions" ADD CONSTRAINT "assistant_pending_actions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assistant_pending_actions_user_course_status" ON "assistant_pending_actions" USING btree ("user_id","course_id","status");--> statement-breakpoint
ALTER TABLE "assistant_pending_actions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "User can read own assistant pending actions" ON "assistant_pending_actions" AS PERMISSIVE FOR SELECT TO public USING (user_id = auth.uid());--> statement-breakpoint
CREATE POLICY "User can insert own assistant pending actions" ON "assistant_pending_actions" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "User can update own assistant pending actions" ON "assistant_pending_actions" AS PERMISSIVE FOR UPDATE TO public USING (user_id = auth.uid());--> statement-breakpoint
