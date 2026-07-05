-- Lesson video upload fields
ALTER TABLE "lessons" ADD COLUMN "video_key" TEXT;
ALTER TABLE "lessons" ADD COLUMN "video_file_name" TEXT;
ALTER TABLE "lessons" ADD COLUMN "video_mime_type" TEXT;
ALTER TABLE "lessons" ADD COLUMN "video_size" INTEGER;
