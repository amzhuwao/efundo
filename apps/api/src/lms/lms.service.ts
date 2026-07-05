import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { LessonStatus, UserRole, Prisma } from '@prisma/client';
import { Response } from 'express';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateModuleDto,
  CreateTopicDto,
  CreateLessonDto,
  UpdateModuleDto,
  UpdateTopicDto,
  UpdateLessonDto,
  UpdateLessonProgressDto,
} from './dto/lms.dto';

const AUTHOR_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.INSTITUTION_ADMIN,
  UserRole.LECTURER,
];

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private canAuthor(role: UserRole) {
    return AUTHOR_ROLES.includes(role);
  }

  private lessonInclude = {
    topic: {
      include: {
        module: {
          include: { subject: { select: { id: true, name: true, code: true } } },
        },
      },
    },
    author: { select: { id: true, fullName: true } },
  } as const;

  async getModulesBySubject(
    subjectId: string,
    userId?: string,
    includeDrafts = false,
  ) {
    const lessonWhere = includeDrafts
      ? {}
      : { status: LessonStatus.PUBLISHED };

    const modules = await this.prisma.module.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              where: lessonWhere,
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                durationMinutes: true,
                difficulty: true,
                status: true,
                videoUrl: true,
                videoKey: true,
              },
            },
          },
        },
      },
    });

    if (!userId) return modules;

    const lessonIds = modules.flatMap((m) =>
      m.topics.flatMap((t) => t.lessons.map((l) => l.id)),
    );
    if (lessonIds.length === 0) return modules;

    const progress = await this.prisma.lessonProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
    });
    const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

    return modules.map((m) => ({
      ...m,
      topics: m.topics.map((t) => ({
        ...t,
        lessons: t.lessons.map((l) => ({
          ...l,
          progress: progressMap.get(l.id) ?? null,
        })),
      })),
    }));
  }

  async getLesson(
    id: string,
    userId?: string,
    userRole?: UserRole,
    forEdit = false,
  ) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: this.lessonInclude,
    });

    if (!lesson) throw new NotFoundException('Lesson not found');

    const isAuthor = userRole && this.canAuthor(userRole);
    if (!forEdit && lesson.status !== LessonStatus.PUBLISHED && !isAuthor) {
      throw new NotFoundException('Lesson not found');
    }

    let progress = null;
    if (userId) {
      progress = await this.prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId: id } },
      });
    }

    return { ...lesson, progress };
  }

  async updateProgress(
    lessonId: string,
    userId: string,
    dto: UpdateLessonProgressDto,
  ) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson || lesson.status !== LessonStatus.PUBLISHED) {
      throw new NotFoundException();
    }

    const completed = dto.completed ?? dto.percentComplete >= 100;

    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        percentComplete: dto.percentComplete,
        lastPosition: dto.lastPosition ?? 0,
        completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        percentComplete: dto.percentComplete,
        lastPosition: dto.lastPosition,
        completed,
        completedAt: completed ? new Date() : undefined,
      },
    });
  }

  async getCatalog() {
    const levels = [
      'PRIMARY',
      'O_LEVEL',
      'A_LEVEL',
      'TERTIARY',
      'OTHER',
    ] as const;

    const result = [];
    for (const level of levels) {
      const programs = await this.prisma.program.findMany({
        where: { level, status: 'active' },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        include: {
          subjects: { orderBy: [{ year: 'asc' }, { name: 'asc' }] },
        },
      });

      const programsWithCounts = await Promise.all(
        programs.map(async (program) => ({
          id: program.id,
          name: program.name,
          slug: program.slug,
          providerName: program.providerName,
          formOrGrade: program.formOrGrade,
          subjects: await Promise.all(
            program.subjects.map(async (subject) => ({
              id: subject.id,
              code: subject.code,
              name: subject.name,
              year: subject.year,
              semester: subject.semester,
              lessonCount: await this.prisma.lesson.count({
                where: {
                  status: LessonStatus.PUBLISHED,
                  topic: { module: { subjectId: subject.id } },
                },
              }),
            })),
          ),
        })),
      );

      result.push({ level, programs: programsWithCounts });
    }
    return result;
  }

  async getUserProgress(userId: string) {
    const [completed, inProgress, totalPublished] = await Promise.all([
      this.prisma.lessonProgress.count({ where: { userId, completed: true } }),
      this.prisma.lessonProgress.count({ where: { userId, completed: false } }),
      this.prisma.lesson.count({ where: { status: LessonStatus.PUBLISHED } }),
    ]);

    const recent = await this.prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        lesson: {
          select: { id: true, title: true, topic: { select: { title: true } } },
        },
      },
    });

    return { completed, inProgress, totalPublished, recent };
  }

  async createModule(subjectId: string, dto: CreateModuleDto, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    return this.prisma.module.create({ data: { ...dto, subjectId } });
  }

  async updateModule(id: string, dto: UpdateModuleDto, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async deleteModule(id: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    await this.prisma.module.delete({ where: { id } });
    return { ok: true };
  }

  async createTopic(moduleId: string, dto: CreateTopicDto, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    return this.prisma.topic.create({ data: { ...dto, moduleId } });
  }

  async updateTopic(id: string, dto: UpdateTopicDto, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    return this.prisma.topic.update({ where: { id }, data: dto });
  }

  async deleteTopic(id: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    await this.prisma.topic.delete({ where: { id } });
    return { ok: true };
  }

  async createLesson(
    topicId: string,
    dto: CreateLessonDto,
    userId: string,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    const { content, ...rest } = dto;
    return this.prisma.lesson.create({
      data: {
        ...rest,
        topicId,
        authorId: userId,
        content: (content ?? []) as Prisma.InputJsonValue,
        status: LessonStatus.DRAFT,
      },
    });
  }

  async updateLesson(
    id: string,
    dto: UpdateLessonDto,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    const { content, ...rest } = dto;
    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...rest,
        ...(content !== undefined
          ? { content: content as Prisma.InputJsonValue }
          : {}),
      },
      include: this.lessonInclude,
    });
  }

  async deleteLesson(id: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (lesson?.videoKey) {
      await this.storage.deleteLocal(lesson.videoKey);
    }
    await this.prisma.lesson.delete({ where: { id } });
    return { ok: true };
  }

  async publishLesson(id: string, action: 'publish' | 'draft', role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();
    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: action === 'publish' ? LessonStatus.PUBLISHED : LessonStatus.DRAFT,
        publishedAt: action === 'publish' ? new Date() : null,
      },
    });
  }

  async attachVideo(
    lessonId: string,
    file: Express.Multer.File,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException();

    if (lesson.videoKey) {
      await this.storage.deleteLocal(lesson.videoKey);
    }

    const fileKey = this.storage.generateFileKey('lessons', lessonId, file.originalname);
    await this.storage.saveLocal(fileKey, file.buffer);

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoKey: fileKey,
        videoFileName: file.originalname,
        videoMimeType: file.mimetype,
        videoSize: file.size,
      },
    });
  }

  async streamLessonVideo(
    lessonId: string,
    res: Response,
    userRole?: UserRole,
  ) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson?.videoKey) throw new NotFoundException('Video not found');

    const isAuthor = userRole && this.canAuthor(userRole);
    if (lesson.status !== LessonStatus.PUBLISHED && !isAuthor) {
      throw new NotFoundException('Video not found');
    }

    const filePath = this.storage.getLocalPath(lesson.videoKey);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Video file missing');

    const stat = fs.statSync(filePath);
    const range = res.req.headers.range;
    const contentType = lesson.videoMimeType ?? 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
