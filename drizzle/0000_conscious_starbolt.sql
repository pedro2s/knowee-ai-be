-- SCRIPT COMPLETO - SUPABASE STYLE RLS
-- Remova se já existirem
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
      CREATE ROLE anon NOINHERIT;
   END IF;

   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
      CREATE ROLE authenticated NOINHERIT;
   END IF;

   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
      CREATE ROLE service_role NOINHERIT;
   END IF;
END
$$;

-- Permitir que service_role ignore RLS
ALTER ROLE service_role BYPASSRLS;

-- Criar Schema auth se não existir
CREATE SCHEMA IF NOT EXISTS auth;

-- Criar funções helper JWT
-- auth.uuid()
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- auth.role()
CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '');
$$;

-- auth.email()
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.email', true), '');
$$;

-- auth.jwt() - retorna JSON completo)
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
BEGIN
  BEGIN
    result := result || jsonb_build_object(
      'sub', current_setting('request.jwt.claim.sub', true),
      'role', current_setting('request.jwt.claim.role', true)
    );
  EXCEPTION WHEN OTHERS THEN
    RETURN '{}'::jsonb;
  END;

  RETURN result;
END;
$$;

-- Permissões básicas no schema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated;

-- Garantir extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Criar tabela auth.users se não existir
CREATE TABLE IF NOT EXISTS auth.users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

	-- Login
	email text UNIQUE,
	encrypted_password text,

	-- Status
	email_confirmed_at timestamptz,
	invited_at timestamptz,
	confirmation_token text,
	recovery_token text,
	email_change_token text,
	email_change text,

	-- Role
	role text DEFAULT 'authenticated',

	-- Metadata
	raw_app_meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	raw_user_meta_data jsonb DEFAULT '{}'::jsonb NOT NULL,

	-- Tracking
	last_sign_in_at timestamptz,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para auth.users
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON auth.users(role);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON auth.users(created_at);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION auth.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auth.handle_updated_at();

-- RLS em auth.users?
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Trigger automático para criar perfil ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Permissões finais
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO service_role;
GRANT ALL ON auth.users TO service_role;

-- END SUPABASE STYLE RLS

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
CREATE INDEX "idx_modules_order" ON "modules" USING btree ("course_id" uuid_ops,"order_index" int4_ops);--> statement-breakpoint
CREATE INDEX "history_user_id_idx" ON "history" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_course_id" ON "lessons" USING btree ("course_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_module_id" ON "lessons" USING btree ("module_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_lessons_order" ON "lessons" USING btree ("course_id" uuid_ops,"module_id" uuid_ops,"order_index" int4_ops);--> statement-breakpoint
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
