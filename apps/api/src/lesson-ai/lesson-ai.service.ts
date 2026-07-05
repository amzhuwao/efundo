import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  AiProjectStatus,
  AiSourceStatus,
  AiSourceType,
  LessonStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ExtractionService } from './extraction.service';
import {
  GeneratedCourseOutline,
  GenerationService,
} from './generation.service';
import {
  CreateLessonAiProjectDto,
  UpdateLessonAiProjectDto,
} from './dto/lesson-ai.dto';

const AUTHOR_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.INSTITUTION_ADMIN,
  UserRole.LECTURER,
];

@Injectable()
export class LessonAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extraction: ExtractionService,
    private readonly generation: GenerationService,
  ) {}

  private canAuthor(role: UserRole) {
    return AUTHOR_ROLES.includes(role);
  }

  private projectInclude = {
    subject: {
      select: {
        id: true,
        name: true,
        code: true,
        program: { select: { id: true, name: true, providerName: true } },
      },
    },
    author: { select: { id: true, fullName: true } },
    sources: { orderBy: { orderIndex: 'asc' as const } },
  };

  async createProject(
    dto: CreateLessonAiProjectDto,
    userId: string,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    return this.prisma.lessonAiProject.create({
      data: {
        subjectId: dto.subjectId,
        title: dto.title,
        instructions: dto.instructions,
        authorId: userId,
      },
      include: this.projectInclude,
    });
  }

  getAiStatus() {
    return { configured: this.extraction.hasAi() };
  }

  async listProjects(subjectId: string | undefined, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    return this.prisma.lessonAiProject.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { updatedAt: 'desc' },
      include: this.projectInclude,
    });
  }

  async getProject(id: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.prisma.lessonAiProject.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(
    id: string,
    dto: UpdateLessonAiProjectDto,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    await this.getProject(id, role);
    return this.prisma.lessonAiProject.update({
      where: { id },
      data: dto,
      include: this.projectInclude,
    });
  }

  async deleteProject(id: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.getProject(id, role);
    for (const source of project.sources) {
      if (source.fileKey) {
        await this.storage.deleteLocal(source.fileKey);
      }
    }
    await this.prisma.lessonAiProject.delete({ where: { id } });
    return { ok: true };
  }

  async addSource(
    projectId: string,
    file: Express.Multer.File,
    role: UserRole,
  ) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.getProject(projectId, role);
    if (project.status === AiProjectStatus.PROCESSING) {
      throw new BadRequestException('Cannot upload while generation is running');
    }

    const type = this.detectSourceType(file.mimetype);
    const fileKey = this.storage.generateFileKey(
      'ai-sources',
      projectId,
      file.originalname,
    );
    await this.storage.saveLocal(fileKey, file.buffer);

    const title = file.originalname.replace(/\.[^.]+$/, '');

    return this.prisma.lessonAiSource.create({
      data: {
        projectId,
        title,
        type,
        fileKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        orderIndex: project.sources.length,
      },
    });
  }

  async removeSource(projectId: string, sourceId: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.getProject(projectId, role);
    if (project.status === AiProjectStatus.PROCESSING) {
      throw new BadRequestException('Cannot modify sources while generating');
    }

    const source = await this.prisma.lessonAiSource.findFirst({
      where: { id: sourceId, projectId },
    });
    if (!source) throw new NotFoundException('Source not found');

    if (source.fileKey) {
      await this.storage.deleteLocal(source.fileKey);
    }
    await this.prisma.lessonAiSource.delete({ where: { id: sourceId } });
    return { ok: true };
  }

  async startGeneration(projectId: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.getProject(projectId, role);
    if (!project.sources.length) {
      throw new BadRequestException('Upload at least one PDF or video source');
    }
    if (project.status === AiProjectStatus.PROCESSING) {
      throw new BadRequestException('Generation already in progress');
    }

    this.generation.ensureConfigured();

    await this.prisma.lessonAiProject.update({
      where: { id: projectId },
      data: { status: AiProjectStatus.PROCESSING, errorMessage: null },
    });

    void this.runGeneration(projectId);

    return { status: AiProjectStatus.PROCESSING };
  }

  private async runGeneration(projectId: string) {
    try {
      const project = await this.prisma.lessonAiProject.findUnique({
        where: { id: projectId },
        include: { sources: { orderBy: { orderIndex: 'asc' } } },
      });
      if (!project) return;

      const readySources: { title: string; type: string; text: string }[] = [];

      for (const source of project.sources) {
        await this.prisma.lessonAiSource.update({
          where: { id: source.id },
          data: { status: AiSourceStatus.EXTRACTING, errorMessage: null },
        });

        try {
          const text = await this.extraction.extractFromSource(
            source.type,
            source.fileKey,
            source.fileName,
            source.mimeType,
          );

          await this.prisma.lessonAiSource.update({
            where: { id: source.id },
            data: {
              extractedText: text,
              status: AiSourceStatus.READY,
            },
          });

          readySources.push({
            title: source.title,
            type: source.type,
            text,
          });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Extraction failed';
          await this.prisma.lessonAiSource.update({
            where: { id: source.id },
            data: { status: AiSourceStatus.FAILED, errorMessage: message },
          });
          throw err;
        }
      }

      const outline = await this.generation.generateOutline(
        project.title,
        project.instructions,
        readySources,
      );

      await this.prisma.lessonAiProject.update({
        where: { id: projectId },
        data: {
          status: AiProjectStatus.READY,
          generatedOutline: outline as unknown as Prisma.InputJsonValue,
          errorMessage: null,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Generation failed';
      await this.prisma.lessonAiProject.update({
        where: { id: projectId },
        data: {
          status: AiProjectStatus.FAILED,
          errorMessage: message,
        },
      });
    }
  }

  async applyToCourse(projectId: string, userId: string, role: UserRole) {
    if (!this.canAuthor(role)) throw new ForbiddenException();

    const project = await this.prisma.lessonAiProject.findUnique({
      where: { id: projectId },
      include: { sources: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== AiProjectStatus.READY || !project.generatedOutline) {
      throw new BadRequestException('Generate a course outline before applying');
    }

    const outline = project.generatedOutline as unknown as GeneratedCourseOutline;
    const sourceByTitle = new Map(
      project.sources.map((s) => [s.title.toLowerCase(), s]),
    );

    let moduleOrder = await this.prisma.module.count({
      where: { subjectId: project.subjectId },
    });

    const created = { modules: 0, topics: 0, lessons: 0 };

    for (const mod of outline.modules) {
      const moduleSlug = await this.uniqueModuleSlug(project.subjectId, mod.slug);
      const createdModule = await this.prisma.module.create({
        data: {
          subjectId: project.subjectId,
          title: mod.title,
          slug: moduleSlug,
          description: mod.description,
          orderIndex: moduleOrder++,
        },
      });
      created.modules++;

      let topicOrder = 0;
      for (const topic of mod.topics ?? []) {
        const topicSlug = await this.uniqueTopicSlug(createdModule.id, topic.slug);
        const createdTopic = await this.prisma.topic.create({
          data: {
            moduleId: createdModule.id,
            title: topic.title,
            slug: topicSlug,
            description: topic.description,
            orderIndex: topicOrder++,
          },
        });
        created.topics++;

        let lessonOrder = 0;
        for (const lesson of topic.lessons ?? []) {
          const lessonSlug = await this.uniqueLessonSlug(
            createdTopic.id,
            lesson.slug,
          );

          const content = (lesson.content ?? []).map((block) => ({ ...block }));

          const videoSource = (lesson.sourceTitles ?? [])
            .map((t) => sourceByTitle.get(t.toLowerCase()))
            .find((s) => s?.type === AiSourceType.VIDEO);

          const createdLesson = await this.prisma.lesson.create({
            data: {
              topicId: createdTopic.id,
              title: lesson.title,
              slug: lessonSlug,
              summary: lesson.summary,
              content: content as Prisma.InputJsonValue,
              durationMinutes: lesson.durationMinutes ?? 15,
              difficulty: lesson.difficulty ?? 'BEGINNER',
              objectives: lesson.objectives ?? [],
              prerequisites: lesson.prerequisites ?? [],
              orderIndex: lessonOrder++,
              authorId: userId,
              status: LessonStatus.DRAFT,
            },
          });
          created.lessons++;

          if (videoSource?.fileKey) {
            const destKey = this.storage.generateFileKey(
              'lessons',
              createdLesson.id,
              videoSource.fileName ?? 'video.mp4',
            );
            const buffer = await this.storage.readLocal(videoSource.fileKey);
            await this.storage.saveLocal(destKey, buffer);
            await this.prisma.lesson.update({
              where: { id: createdLesson.id },
              data: {
                videoKey: destKey,
                videoFileName: videoSource.fileName,
                videoMimeType: videoSource.mimeType,
                videoSize: videoSource.fileSize,
              },
            });
          }
        }
      }
    }

    await this.prisma.lessonAiProject.update({
      where: { id: projectId },
      data: {
        status: AiProjectStatus.APPLIED,
        appliedAt: new Date(),
      },
    });

    return {
      ok: true,
      subjectId: project.subjectId,
      created,
    };
  }

  private detectSourceType(mimeType: string): AiSourceType {
    if (mimeType === 'application/pdf') return AiSourceType.PDF;
    if (mimeType.startsWith('video/')) return AiSourceType.VIDEO;
    throw new BadRequestException(
      'Only PDF and video files are supported (application/pdf, video/*)',
    );
  }

  private async uniqueModuleSlug(subjectId: string, base: string) {
    return this.uniqueSlug(base, async (slug) => {
      const existing = await this.prisma.module.findUnique({
        where: { subjectId_slug: { subjectId, slug } },
      });
      return !!existing;
    });
  }

  private async uniqueTopicSlug(moduleId: string, base: string) {
    return this.uniqueSlug(base, async (slug) => {
      const existing = await this.prisma.topic.findUnique({
        where: { moduleId_slug: { moduleId, slug } },
      });
      return !!existing;
    });
  }

  private async uniqueLessonSlug(topicId: string, base: string) {
    return this.uniqueSlug(base, async (slug) => {
      const existing = await this.prisma.lesson.findUnique({
        where: { topicId_slug: { topicId, slug } },
      });
      return !!existing;
    });
  }

  private async uniqueSlug(
    base: string,
    exists: (slug: string) => Promise<boolean>,
  ) {
    const normalized = base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);

    let slug = normalized || 'item';
    let n = 2;
    while (await exists(slug)) {
      slug = `${normalized}-${n++}`.slice(0, 60);
    }
    return slug;
  }
}
