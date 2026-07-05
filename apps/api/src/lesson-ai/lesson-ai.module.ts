import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { LessonAiController } from './lesson-ai.controller';
import { LessonAiService } from './lesson-ai.service';
import { ExtractionService } from './extraction.service';
import { GenerationService } from './generation.service';

@Module({
  imports: [AiModule],
  controllers: [LessonAiController],
  providers: [LessonAiService, ExtractionService, GenerationService],
  exports: [ExtractionService],
})
export class LessonAiModule {}
