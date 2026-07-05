import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateModuleDto,
  CreateTopicDto,
  CreateLessonDto,
  UpdateModuleDto,
  UpdateTopicDto,
  UpdateLessonDto,
  UpdateLessonProgressDto,
  PublishLessonDto,
} from './dto/lms.dto';

@ApiTags('lms')
@Controller('lms')
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('catalog')
  @ApiOperation({ summary: 'Browse levels, programs, and subjects with lesson counts' })
  getCatalog() {
    return this.lmsService.getCatalog();
  }

  @Get('subjects/:subjectId/modules')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get modules, topics, and lessons for a subject' })
  getModules(
    @Param('subjectId') subjectId: string,
    @Request() req: { user?: { id: string } },
  ) {
    return this.lmsService.getModulesBySubject(subjectId, req.user?.id);
  }

  @Get('subjects/:subjectId/modules/manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full module tree including drafts (authors)' })
  getModulesForManage(
    @Param('subjectId') subjectId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.lmsService.getModulesBySubject(subjectId, req.user.id, true);
  }

  @Get('lessons/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson content' })
  getLesson(
    @Param('id') id: string,
    @Request() req: { user?: { id: string; role: UserRole } },
  ) {
    return this.lmsService.getLesson(id, req.user?.id, req.user?.role);
  }

  @Get('lessons/:id/manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson for editing (includes drafts)' })
  getLessonForManage(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.lmsService.getLesson(id, req.user.id, req.user.role, true);
  }

  @Get('lessons/:id/video')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Stream lesson video' })
  streamVideo(
    @Param('id') id: string,
    @Request() req: { user?: { role: UserRole } },
    @Res() res: Response,
  ) {
    return this.lmsService.streamLessonVideo(id, res, req.user?.role);
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user learning progress summary' })
  getProgress(@Request() req: { user: { id: string } }) {
    return this.lmsService.getUserProgress(req.user.id);
  }

  @Patch('lessons/:id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson progress' })
  updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateLessonProgressDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.lmsService.updateProgress(id, req.user.id, dto);
  }

  @Post('subjects/:subjectId/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  createModule(
    @Param('subjectId') subjectId: string,
    @Body() dto: CreateModuleDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.createModule(subjectId, dto, req.user.role);
  }

  @Patch('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  updateModule(
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.updateModule(id, dto, req.user.role);
  }

  @Delete('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  deleteModule(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.deleteModule(id, req.user.role);
  }

  @Post('modules/:moduleId/topics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  createTopic(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateTopicDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.createTopic(moduleId, dto, req.user.role);
  }

  @Patch('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  updateTopic(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.updateTopic(id, dto, req.user.role);
  }

  @Delete('topics/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  deleteTopic(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.deleteTopic(id, req.user.role);
  }

  @Post('topics/:topicId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  createLesson(
    @Param('topicId') topicId: string,
    @Body() dto: CreateLessonDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.lmsService.createLesson(topicId, dto, req.user.id, req.user.role);
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  updateLesson(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.updateLesson(id, dto, req.user.role);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  deleteLesson(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.deleteLesson(id, req.user.role);
  }

  @Post('lessons/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  publishLesson(
    @Param('id') id: string,
    @Body() dto: PublishLessonDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.publishLesson(id, dto.action, req.user.role);
  }

  @Post('lessons/:id/video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload lesson video file' })
  @UseInterceptors(FileInterceptor('file'))
  uploadVideo(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.lmsService.attachVideo(id, file, req.user.role);
  }
}
