import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LessonAiService } from './lesson-ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateLessonAiProjectDto,
  UpdateLessonAiProjectDto,
} from './dto/lesson-ai.dto';

const AUTHOR_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.INSTITUTION_ADMIN,
  UserRole.LECTURER,
] as const;

@ApiTags('lesson-ai')
@Controller('lesson-ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...AUTHOR_ROLES)
@ApiBearerAuth()
export class LessonAiController {
  constructor(private readonly lessonAiService: LessonAiService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Create an AI course generation project' })
  createProject(
    @Body() dto: CreateLessonAiProjectDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.lessonAiService.createProject(dto, req.user.id, req.user.role);
  }

  @Get('projects')
  @ApiOperation({ summary: 'List AI generation projects' })
  listProjects(
    @Query('subjectId') subjectId: string | undefined,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.listProjects(subjectId, req.user.role);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get project with sources and generated outline' })
  getProject(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.getProject(id, req.user.role);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update project title or instructions' })
  updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateLessonAiProjectDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.updateProject(id, dto, req.user.role);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete project and source files' })
  deleteProject(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.deleteProject(id, req.user.role);
  }

  @Post('projects/:id/sources')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload PDF or video source material' })
  @UseInterceptors(FileInterceptor('file'))
  uploadSource(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 200 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.addSource(id, file, req.user.role);
  }

  @Delete('projects/:id/sources/:sourceId')
  @ApiOperation({ summary: 'Remove a source file' })
  removeSource(
    @Param('id') id: string,
    @Param('sourceId') sourceId: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.removeSource(id, sourceId, req.user.role);
  }

  @Post('projects/:id/generate')
  @ApiOperation({ summary: 'Extract sources and generate course outline with AI' })
  generate(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lessonAiService.startGeneration(id, req.user.role);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check whether AI generation is configured' })
  status() {
    return this.lessonAiService.getAiStatus();
  }

  @Post('projects/:id/apply')
  @ApiOperation({ summary: 'Create draft modules, topics, and lessons from outline' })
  apply(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.lessonAiService.applyToCourse(id, req.user.id, req.user.role);
  }
}
