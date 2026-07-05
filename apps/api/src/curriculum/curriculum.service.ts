import { Injectable, NotFoundException } from '@nestjs/common';
import { EducationLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgramDto, CreateSubjectDto, UpdateProgramDto, UpdateSubjectDto, LEVEL_LABELS } from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  constructor(private readonly prisma: PrismaService) {}

  getLevels() {
    return (Object.keys(LEVEL_LABELS) as EducationLevel[]).map((value) => ({
      value,
      label: LEVEL_LABELS[value],
    }));
  }

  findPrograms(level?: EducationLevel, providerName?: string) {
    const where: Prisma.ProgramWhereInput = { status: 'active' };
    if (level) where.level = level;
    if (providerName) {
      where.providerName = { contains: providerName, mode: 'insensitive' };
    }
    return this.prisma.program.findMany({
      where,
      orderBy: [{ level: 'asc' }, { orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        subjects: { orderBy: [{ year: 'asc' }, { name: 'asc' }] },
      },
    });
  }

  async findProgram(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        subjects: { orderBy: [{ year: 'asc' }, { name: 'asc' }] },
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async getSubjectsByProgram(programId: string, year?: number) {
    await this.findProgram(programId);
    return this.prisma.subject.findMany({
      where: { programId, ...(year ? { year } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  createProgram(dto: CreateProgramDto) {
    return this.prisma.program.create({ data: dto });
  }

  async createSubject(programId: string, dto: CreateSubjectDto) {
    await this.findProgram(programId);
    return this.prisma.subject.create({ data: { ...dto, programId } });
  }

  async updateProgram(id: string, dto: UpdateProgramDto) {
    await this.findProgram(id);
    return this.prisma.program.update({ where: { id }, data: dto });
  }

  async archiveProgram(id: string) {
    await this.findProgram(id);
    return this.prisma.program.update({
      where: { id },
      data: { status: 'archived' },
    });
  }

  async updateSubject(id: string, dto: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async deleteSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.subject.delete({ where: { id } });
  }

  async getProviders(level: EducationLevel) {
    const rows = await this.prisma.program.findMany({
      where: { level, status: 'active', providerName: { not: null } },
      select: { providerName: true },
      distinct: ['providerName'],
      orderBy: { providerName: 'asc' },
    });
    return rows.map((r) => r.providerName).filter(Boolean) as string[];
  }
}
