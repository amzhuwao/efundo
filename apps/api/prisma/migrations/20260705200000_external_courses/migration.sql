-- External course listings (link-only, with attribution)
ALTER TYPE "ResourceType" ADD VALUE IF NOT EXISTS 'EXTERNAL_COURSE';

ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "external_url" TEXT;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "source_name" TEXT;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "source_catalog_url" TEXT;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "attribution_notice" TEXT;
ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "duration_weeks" INTEGER;
