-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'ESSAY';

-- CreateTable
CREATE TABLE "quiz_certificates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_certificates_attempt_id_key" ON "quiz_certificates"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_certificates_code_key" ON "quiz_certificates"("code");

-- CreateIndex
CREATE INDEX "quiz_certificates_user_id_idx" ON "quiz_certificates"("user_id");

-- AddForeignKey
ALTER TABLE "quiz_certificates" ADD CONSTRAINT "quiz_certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_certificates" ADD CONSTRAINT "quiz_certificates_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_certificates" ADD CONSTRAINT "quiz_certificates_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
