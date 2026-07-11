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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole, QuestionStatus } from '@prisma/client';
import { AssessmentService } from './assessment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  CreateQuizDto,
  UpdateQuizDto,
  SubmitAttemptDto,
} from './dto/assessment.dto';

@ApiTags('assessment')
@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // ── Student-facing ────────────────────────────────────────────────────────

  @Get('quizzes')
  @ApiOperation({ summary: 'List published quizzes' })
  listQuizzes(@Query('subjectId') subjectId?: string) {
    return this.assessmentService.listQuizzes(subjectId, true);
  }

  @Get('quizzes/:id')
  @ApiOperation({ summary: 'Get quiz details' })
  getQuiz(@Param('id') id: string) {
    return this.assessmentService.getQuiz(id, false);
  }

  @Post('quizzes/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a quiz attempt' })
  start(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assessmentService.startAttempt(id, req.user.id);
  }

  @Post('attempts/:id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit quiz answers' })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitAttemptDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.assessmentService.submitAttempt(id, req.user.id, dto);
  }

  @Get('attempts/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My attempt history' })
  myAttempts(@Request() req: { user: { id: string } }) {
    return this.assessmentService.listMyAttempts(req.user.id);
  }

  @Get('attempts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get attempt with results' })
  getAttempt(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assessmentService.getAttempt(id, req.user.id);
  }

  @Get('stats/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My performance summary' })
  myStats(@Request() req: { user: { id: string } }) {
    return this.assessmentService.getMyStats(req.user.id);
  }

  @Get('certificates/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My mock exam certificates' })
  myCertificates(@Request() req: { user: { id: string } }) {
    return this.assessmentService.listMyCertificates(req.user.id);
  }

  @Get('certificates/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate details' })
  getCertificate(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.assessmentService.getCertificate(id, req.user.id);
  }

  // ── Authoring (lecturer/admin) ────────────────────────────────────────────

  @Get('manage/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List questions for management' })
  listQuestions(
    @Query('subjectId') subjectId?: string,
    @Query('status') status?: QuestionStatus,
  ) {
    return this.assessmentService.listQuestions(subjectId, status);
  }

  @Post('manage/questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a question' })
  createQuestion(
    @Body() dto: CreateQuestionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.assessmentService.createQuestion(dto, req.user.id);
  }

  @Patch('manage/questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.updateQuestion(id, dto, req.user.role);
  }

  @Post('manage/questions/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  publishQuestion(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.publishQuestion(id, req.user.role);
  }

  @Post('manage/questions/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  unpublishQuestion(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.unpublishQuestion(id, req.user.role);
  }

  @Delete('manage/questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  deleteQuestion(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.deleteQuestion(id, req.user.role);
  }

  @Get('manage/quizzes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  listManageQuizzes(@Query('subjectId') subjectId?: string) {
    return this.assessmentService.listQuizzes(subjectId, false);
  }

  @Get('manage/quizzes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  getManageQuiz(@Param('id') id: string) {
    return this.assessmentService.getQuiz(id, true);
  }

  @Post('manage/quizzes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  createQuiz(
    @Body() dto: CreateQuizDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.assessmentService.createQuiz(dto, req.user.id, req.user.role);
  }

  @Patch('manage/quizzes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  updateQuiz(
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.updateQuiz(id, dto, req.user.role);
  }

  @Post('manage/quizzes/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  publishQuiz(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.publishQuiz(id, req.user.role);
  }

  @Post('manage/quizzes/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  unpublishQuiz(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.unpublishQuiz(id, req.user.role);
  }

  @Delete('manage/quizzes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  deleteQuiz(
    @Param('id') id: string,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.assessmentService.deleteQuiz(id, req.user.role);
  }
}
