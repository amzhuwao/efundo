-- AI-assisted lesson generation (NotebookLM-style source projects)

CREATE TYPE "AiProjectStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'APPLIED', 'FAILED');
CREATE TYPE "AiSourceStatus" AS ENUM ('PENDING', 'EXTRACTING', 'READY', 'FAILED');
CREATE TYPE "AiSourceType" AS ENUM ('PDF', 'VIDEO', 'TEXT');

CREATE TABLE "lesson_ai_projects" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "status" "AiProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "generated_outline" JSONB,
    "error_message" TEXT,
    "author_id" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_ai_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lesson_ai_sources" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AiSourceType" NOT NULL,
    "file_key" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "extracted_text" TEXT,
    "status" "AiSourceStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_ai_sources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lesson_ai_projects_subject_id_idx" ON "lesson_ai_projects"("subject_id");
CREATE INDEX "lesson_ai_projects_author_id_idx" ON "lesson_ai_projects"("author_id");
CREATE INDEX "lesson_ai_projects_status_idx" ON "lesson_ai_projects"("status");
CREATE INDEX "lesson_ai_sources_project_id_idx" ON "lesson_ai_sources"("project_id");

ALTER TABLE "lesson_ai_projects" ADD CONSTRAINT "lesson_ai_projects_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_ai_projects" ADD CONSTRAINT "lesson_ai_projects_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_ai_sources" ADD CONSTRAINT "lesson_ai_sources_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "lesson_ai_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
