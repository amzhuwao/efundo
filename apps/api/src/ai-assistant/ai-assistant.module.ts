import { Module } from '@nestjs/common';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiModule } from '../ai/ai.module';
import { LessonAiModule } from '../lesson-ai/lesson-ai.module';

@Module({
  imports: [AiModule, LessonAiModule],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
})
export class AiAssistantModule {}
