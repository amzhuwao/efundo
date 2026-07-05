-- Student AI assistant: chat sessions, messages, assignment uploads

CREATE TYPE "AiChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

CREATE TABLE "ai_assistant_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subject_id" TEXT,
    "lesson_id" TEXT,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_assistant_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_assistant_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "AiChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_assistant_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_assistant_files" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "extracted_text" TEXT,
    "status" "AiSourceStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_assistant_files_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_assistant_sessions_user_id_idx" ON "ai_assistant_sessions"("user_id");
CREATE INDEX "ai_assistant_sessions_subject_id_idx" ON "ai_assistant_sessions"("subject_id");
CREATE INDEX "ai_assistant_sessions_lesson_id_idx" ON "ai_assistant_sessions"("lesson_id");
CREATE INDEX "ai_assistant_messages_session_id_idx" ON "ai_assistant_messages"("session_id");
CREATE INDEX "ai_assistant_files_session_id_idx" ON "ai_assistant_files"("session_id");

ALTER TABLE "ai_assistant_sessions" ADD CONSTRAINT "ai_assistant_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_assistant_sessions" ADD CONSTRAINT "ai_assistant_sessions_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_assistant_sessions" ADD CONSTRAINT "ai_assistant_sessions_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_assistant_messages" ADD CONSTRAINT "ai_assistant_messages_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "ai_assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_assistant_files" ADD CONSTRAINT "ai_assistant_files_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "ai_assistant_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
