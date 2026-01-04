-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"content" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "qa_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"course_id" uuid,
	"question" text,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qa_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"full_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"phone" text,
	"company" text,
	"bio" text
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"message" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"course_id" uuid
);
--> statement-breakpoint
ALTER TABLE "history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mux_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" varchar(255) NOT NULL,
	"playback_id" varchar(255) NOT NULL,
	"lesson_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mux_data_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "pgmigrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"run_on" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"stripe_customer_id" text,
	"subscribed" boolean DEFAULT false NOT NULL,
	"subscription_end" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription_tier_id" integer NOT NULL,
	"stripe_subscription_id" text
);
--> statement-breakpoint
ALTER TABLE "subscribers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"level" text,
	"duration" text,
	"target_audience" text,
	"objectives" text,
	"files" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "token_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"total_tokens" integer,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscription_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_tier" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_token_limit" integer NOT NULL,
	"price" numeric(8, 2),
	"stripe_price_id" text
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"lesson_type" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb,
	"assets" jsonb DEFAULT '[]'::jsonb,
	"order_index" integer DEFAULT 1 NOT NULL,
	"duration" integer,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_lesson_type_check" CHECK (lesson_type = ANY (ARRAY['video'::text, 'audio'::text, 'quiz'::text, 'pdf'::text, 'external'::text, 'article'::text]))
);
--> statement-breakpoint
ALTER TABLE "lessons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "history_summary" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"summary" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "history_summary_pkey" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_history" ADD CONSTRAINT "qa_history_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_history" ADD CONSTRAINT "qa_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mux_data" ADD CONSTRAINT "mux_data_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_subscription_tier_id_fkey" FOREIGN KEY ("subscription_tier_id") REFERENCES "public"."subscription_tier"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_summary" ADD CONSTRAINT "history_summary_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_summary" ADD CONSTRAINT "history_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_embedding_idx" ON "documents" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100);--> statement-breakpoint
CREATE INDEX "idx_modules_course_id" ON "modules" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_modules_order" ON "modules" USING btree ("course_id" int4_ops,"order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "history_user_id_idx" ON "history" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_course_id" ON "lessons" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_module_id" ON "lessons" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_order" ON "lessons" USING btree ("course_id" int4_ops,"module_id" uuid_ops,"order_index" uuid_ops);--> statement-breakpoint
CREATE POLICY "Usuário pode ver seus próprios documentos" ON "documents" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Usuário pode inserir documentos seus próprios documentos" ON "documents" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Usuário pode atualizar seus próprios documentos" ON "documents" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Usuário pode excluir seus próprios documentos" ON "documents" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own course modules" ON "modules" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Users can create modules for their courses" ON "modules" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their course modules" ON "modules" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their course modules" ON "modules" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Usuário pode ver seus próprios históricos" ON "qa_history" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Usuário pode inserir seus próprios historicos" ON "qa_history" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own profile" ON "profiles" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can insert their own profile" ON "profiles" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Usuário pode ver seus próprios históricos" ON "history" AS PERMISSIVE FOR SELECT TO public USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Usuário pode inserir documentos seus próprios documentos" ON "history" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own history" ON "history" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "select_own_subscription" ON "subscribers" AS PERMISSIVE FOR SELECT TO public USING (((user_id = auth.uid()) OR (email = auth.email())));--> statement-breakpoint
CREATE POLICY "update_own_subscription" ON "subscribers" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "insert_subscription" ON "subscribers" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own courses" ON "courses" AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));--> statement-breakpoint
CREATE POLICY "Users can create their own courses" ON "courses" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their own courses" ON "courses" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their own courses" ON "courses" AS PERMISSIVE FOR DELETE TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own course lessons" ON "lessons" AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = lessons.course_id) AND (courses.user_id = auth.uid())))));--> statement-breakpoint
CREATE POLICY "Users can create lessons for their courses" ON "lessons" AS PERMISSIVE FOR INSERT TO public;--> statement-breakpoint
CREATE POLICY "Users can update their course lessons" ON "lessons" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can delete their course lessons" ON "lessons" AS PERMISSIVE FOR DELETE TO public;
