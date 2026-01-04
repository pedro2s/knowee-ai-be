ALTER TABLE "qa_history" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "id" SET DATA TYPE uuid USING gen_random_uuid();--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "course_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "question" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "qa_history" ALTER COLUMN "answer" SET NOT NULL;