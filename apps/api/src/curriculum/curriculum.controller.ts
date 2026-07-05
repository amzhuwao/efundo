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
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EducationLevel, UserRole } from '@prisma/client';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProgramDto, CreateSubjectDto, UpdateProgramDto, UpdateSubjectDto } from './dto/curriculum.dto';

@ApiTags('curriculum')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('levels')
  @ApiOperation({ summary: 'List education levels' })
  getLevels() {
    return this.curriculumService.getLevels();
  }

  @Get('programs')
  @ApiOperation({ summary: 'List programs, optionally filtered by level' })
  findPrograms(
    @Query('level', new ParseEnumPipe(EducationLevel, { optional: true }))
    level?: EducationLevel,
    @Query('provider') provider?: string,
  ) {
    return this.curriculumService.findPrograms(level, provider);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get program with subjects' })
  findProgram(@Param('id') id: string) {
    return this.curriculumService.findProgram(id);
  }

  @Get('programs/:id/subjects')
  @ApiOperation({ summary: 'List subjects for a program' })
  getSubjects(
    @Param('id') id: string,
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
  ) {
    return this.curriculumService.getSubjectsByProgram(id, year);
  }

  @Get('levels/:level/providers')
  @ApiOperation({ summary: 'List providers (schools/universities) for a level' })
  getProviders(@Param('level', new ParseEnumPipe(EducationLevel)) level: EducationLevel) {
    return this.curriculumService.getProviders(level);
  }

  @Post('programs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create program (admin)' })
  createProgram(@Body() dto: CreateProgramDto) {
    return this.curriculumService.createProgram(dto);
  }

  @Post('programs/:programId/subjects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add subject to program (admin)' })
  createSubject(
    @Param('programId') programId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.curriculumService.createSubject(programId, dto);
  }

  @Patch('programs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update program (admin)' })
  updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    return this.curriculumService.updateProgram(id, dto);
  }

  @Delete('programs/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive program (admin)' })
  archiveProgram(@Param('id') id: string) {
    return this.curriculumService.archiveProgram(id);
  }

  @Patch('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.LECTURER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update subject (admin)' })
  updateSubject(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.curriculumService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete subject (admin)' })
  deleteSubject(@Param('id') id: string) {
    return this.curriculumService.deleteSubject(id);
  }
}
