CREATE TABLE "provider_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_provider" text DEFAULT 'openai' NOT NULL,
	"audio_provider" text DEFAULT 'openai' NOT NULL,
	"audio_voice_id" text DEFAULT 'nova' NOT NULL,
	"video_provider" text DEFAULT 'openai' NOT NULL,
	"advanced_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_provider_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"image_provider" text DEFAULT 'openai' NOT NULL,
	"audio_provider" text DEFAULT 'openai' NOT NULL,
	"audio_voice_id" text DEFAULT 'nova' NOT NULL,
	"video_provider" text DEFAULT 'openai' NOT NULL,
	"advanced_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_preferences" ADD CONSTRAINT "provider_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_provider_preferences" ADD CONSTRAINT "course_provider_preferences_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_provider_preferences" ADD CONSTRAINT "course_provider_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_preferences_user_id_uidx" ON "provider_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_provider_preferences_user_id" ON "provider_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "course_provider_preferences_course_id_uidx" ON "course_provider_preferences" USING btree ("course_id");
--> statement-breakpoint
CREATE INDEX "idx_course_provider_preferences_user_id" ON "course_provider_preferences" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_course_provider_preferences_course_id" ON "course_provider_preferences" USING btree ("course_id");
--> statement-breakpoint
ALTER TABLE "provider_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "course_provider_preferences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "Users can view their own provider preferences" ON "provider_preferences" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = user_id));
--> statement-breakpoint
CREATE POLICY "Users can insert their own provider preferences" ON "provider_preferences" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can update their own provider preferences" ON "provider_preferences" AS PERMISSIVE FOR UPDATE TO "public" USING (true) WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can view own course provider preferences" ON "course_provider_preferences" AS PERMISSIVE FOR SELECT TO "public" USING ((auth.uid() = user_id));
--> statement-breakpoint
CREATE POLICY "Users can insert own course provider preferences" ON "course_provider_preferences" AS PERMISSIVE FOR INSERT TO "public" WITH CHECK (true);
--> statement-breakpoint
CREATE POLICY "Users can update own course provider preferences" ON "course_provider_preferences" AS PERMISSIVE FOR UPDATE TO "public" USING (true) WITH CHECK (true);
