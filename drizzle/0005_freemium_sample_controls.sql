ALTER TABLE "subscribers"
ADD COLUMN "sample_course_id" uuid,
ADD COLUMN "sample_consumed_at" timestamp with time zone,
ADD COLUMN "sample_generation_count" integer DEFAULT 0 NOT NULL;
