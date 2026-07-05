import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateAssistantSessionDto,
  SendAssistantMessageDto,
} from './dto/ai-assistant.dto';

@ApiTags('ai-assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiAssistantController {
  constructor(private readonly assistantService: AiAssistantService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Start a new AI tutoring conversation' })
  createSession(
    @Body() dto: CreateAssistantSessionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.createSession(req.user.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List my conversations' })
  listSessions(@Request() req: { user: { id: string } }) {
    return this.assistantService.listSessions(req.user.id);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get conversation with messages and files' })
  getSession(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.getSession(id, req.user.id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  deleteSession(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.deleteSession(id, req.user.id);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message and receive AI reply' })
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendAssistantMessageDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.sendMessage(id, req.user.id, dto);
  }

  @Post('sessions/:id/files')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload assignment (PDF, image, or text file)' })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.uploadFile(id, req.user.id, file);
  }

  @Delete('sessions/:id/files/:fileId')
  @ApiOperation({ summary: 'Remove an uploaded file' })
  removeFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assistantService.removeFile(id, fileId, req.user.id);
  }
}
