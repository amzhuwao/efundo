-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('PRIMARY', 'O_LEVEL', 'A_LEVEL', 'TERTIARY', 'OTHER');

-- CreateTable programs
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "level" "EducationLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "provider_name" TEXT,
    "form_or_grade" INTEGER,
    "duration_years" INTEGER,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "programs_level_slug_key" ON "programs"("level", "slug");
CREATE INDEX "programs_level_idx" ON "programs"("level");

-- Migrate tertiary courses → programs (reuse course id)
INSERT INTO "programs" ("id", "level", "name", "slug", "provider_name", "duration_years", "updated_at")
SELECT
    c."id",
    'TERTIARY'::"EducationLevel",
    c."name",
    i."slug" || '-' || c."slug",
    i."name",
    c."duration_years",
    NOW()
FROM "courses" c
JOIN "departments" d ON d."id" = c."department_id"
JOIN "faculties" f ON f."id" = d."faculty_id"
JOIN "institutions" i ON i."id" = f."institution_id";

-- Subjects: course_id → program_id
ALTER TABLE "subjects" ADD COLUMN "program_id" TEXT;
UPDATE "subjects" SET "program_id" = "course_id";
ALTER TABLE "subjects" ALTER COLUMN "program_id" SET NOT NULL;
ALTER TABLE "subjects" ALTER COLUMN "year" DROP NOT NULL;

ALTER TABLE "subjects" DROP CONSTRAINT IF EXISTS "subjects_course_id_fkey";
DROP INDEX IF EXISTS "subjects_course_id_idx";
DROP INDEX IF EXISTS "subjects_course_id_code_key";
ALTER TABLE "subjects" DROP COLUMN "course_id";

CREATE UNIQUE INDEX "subjects_program_id_code_key" ON "subjects"("program_id", "code");
CREATE INDEX "subjects_program_id_idx" ON "subjects"("program_id");

ALTER TABLE "subjects" ADD CONSTRAINT "subjects_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Users
ALTER TABLE "users" ADD COLUMN "education_level" "EducationLevel";
ALTER TABLE "users" ADD COLUMN "program_id" TEXT;

UPDATE "users" SET
    "program_id" = "course_id",
    "education_level" = 'TERTIARY'::"EducationLevel"
WHERE "course_id" IS NOT NULL;

ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_institution_id_fkey";
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_course_id_fkey";
DROP INDEX IF EXISTS "users_institution_id_idx";
DROP INDEX IF EXISTS "users_course_id_idx";
ALTER TABLE "users" DROP COLUMN "institution_id";
ALTER TABLE "users" DROP COLUMN "course_id";

CREATE INDEX "users_program_id_idx" ON "users"("program_id");
CREATE INDEX "users_education_level_idx" ON "users"("education_level");

ALTER TABLE "users" ADD CONSTRAINT "users_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Resources
ALTER TABLE "resources" ADD COLUMN "education_level" "EducationLevel";
ALTER TABLE "resources" ADD COLUMN "program_id" TEXT;

UPDATE "resources" r SET
    "program_id" = s."program_id",
    "education_level" = 'TERTIARY'::"EducationLevel"
FROM "subjects" s
WHERE r."subject_id" = s."id" AND r."program_id" IS NULL;

UPDATE "resources" r SET
    "program_id" = p."id",
    "education_level" = 'TERTIARY'::"EducationLevel"
FROM "institutions" i
JOIN "faculties" f ON f."institution_id" = i."id"
JOIN "departments" d ON d."faculty_id" = f."id"
JOIN "courses" c ON c."department_id" = d."id"
JOIN "programs" p ON p."id" = c."id"
WHERE r."institution_id" = i."id" AND r."program_id" IS NULL;

ALTER TABLE "resources" DROP CONSTRAINT IF EXISTS "resources_institution_id_fkey";
DROP INDEX IF EXISTS "resources_institution_id_idx";
DROP INDEX IF EXISTS "resources_institution_id_slug_key";
ALTER TABLE "resources" DROP COLUMN "institution_id";

CREATE UNIQUE INDEX "resources_program_id_slug_key" ON "resources"("program_id", "slug");
CREATE INDEX "resources_program_id_idx" ON "resources"("program_id");
CREATE INDEX "resources_education_level_idx" ON "resources"("education_level");

ALTER TABLE "resources" ADD CONSTRAINT "resources_program_id_fkey"
    FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old hierarchy
DROP TABLE IF EXISTS "courses" CASCADE;
DROP TABLE IF EXISTS "departments" CASCADE;
DROP TABLE IF EXISTS "faculties" CASCADE;
DROP TABLE IF EXISTS "institutions" CASCADE;
