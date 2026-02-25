ALTER TABLE "subscription_tier"
	ADD COLUMN "display_name" text,
	ADD COLUMN "billing_period" text,
	ADD COLUMN "description" text,
	ADD COLUMN "features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	ADD COLUMN "is_highlighted" boolean DEFAULT false NOT NULL,
	ADD COLUMN "is_contact_only" boolean DEFAULT false NOT NULL,
	ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL,
	ADD COLUMN "is_public" boolean DEFAULT true NOT NULL,
	ADD COLUMN "support_channel" text DEFAULT 'email' NOT NULL,
	ADD COLUMN "support_sla_hours" integer DEFAULT 72 NOT NULL;

UPDATE "subscription_tier"
SET "display_name" = CASE "name"
	WHEN 'free' THEN 'Gratuito'
	WHEN 'premium' THEN 'Premium'
	WHEN 'pro' THEN 'Professional'
	WHEN 'enterprise' THEN 'Empresarial'
	ELSE initcap("name")
END
WHERE "display_name" IS NULL;

ALTER TABLE "subscription_tier"
	ALTER COLUMN "display_name" SET NOT NULL;

UPDATE "subscription_tier"
SET
	"billing_period" = NULL,
	"description" = 'Ideal para testar a plataforma com autoatendimento.',
	"features" = '["1 curso de amostra vitalicio", "Sem geracao de assets", "Sem exportacao", "IA limitada por tokens", "Suporte humano por email (ate 72h)"]'::jsonb,
	"is_highlighted" = false,
	"is_contact_only" = false,
	"sort_order" = 1,
	"is_public" = true,
	"support_channel" = 'email',
	"support_sla_hours" = 72
WHERE "name" = 'free';

UPDATE "subscription_tier"
SET
	"billing_period" = '/mes',
	"description" = 'Para criadores que querem escalar com IA sem friccao.',
	"features" = '["Cursos ilimitados", "IA avancada", "Exportacao LMS", "Suporte prioritario por email (ate 72h)", "Tokens/mes: 100k"]'::jsonb,
	"is_highlighted" = true,
	"is_contact_only" = false,
	"sort_order" = 2,
	"is_public" = true,
	"support_channel" = 'email',
	"support_sla_hours" = 72
WHERE "name" = 'premium';

UPDATE "subscription_tier"
SET
	"billing_period" = '/mes',
	"description" = 'Para operacoes com volume alto e automacao avancada.',
	"features" = '["Tudo do Premium", "API customizada", "Suporte dedicado por email (ate 72h)", "Tokens/mes: 400k"]'::jsonb,
	"is_highlighted" = false,
	"is_contact_only" = false,
	"sort_order" = 3,
	"is_public" = true,
	"support_channel" = 'email',
	"support_sla_hours" = 72
WHERE "name" = 'pro';

UPDATE "subscription_tier"
SET
	"billing_period" = NULL,
	"description" = 'Plano sob medida para necessidades empresariais.',
	"features" = '["Tudo do Professional", "White-label", "Arquitetura sob consulta", "Suporte humano por email (ate 72h)"]'::jsonb,
	"is_highlighted" = false,
	"is_contact_only" = true,
	"sort_order" = 4,
	"is_public" = true,
	"support_channel" = 'email',
	"support_sla_hours" = 72
WHERE "name" = 'enterprise';

CREATE UNIQUE INDEX IF NOT EXISTS "subscription_tier_name_uidx"
ON "subscription_tier" USING btree ("name");
