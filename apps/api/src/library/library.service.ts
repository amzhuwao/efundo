import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  ResourceStatus,
  ResourceType,
  UserRole,
  EducationLevel,
} from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { GeminiService } from '../ai/gemini.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ModerateResourceDto,
  CreateReviewDto,
  SearchResourcesDto,
} from './dto/library.dto';

const INGEST_RESOURCE_TYPES = Object.values(ResourceType);
const INGEST_LEVELS = Object.values(EducationLevel);

export type IngestClassification = {
  type: ResourceType;
  title: string;
  description?: string | null;
  author?: string | null;
  year?: number | null;
  semester?: number | null;
  suggestedSubjectCode?: string | null;
  suggestedSubjectName?: string | null;
  educationLevel?: EducationLevel | null;
  tags: string[];
  confidence: number;
  rationale?: string | null;
  textPreview: string;
  fileName: string;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  private resourceInclude = {
    program: {
      select: {
        id: true,
        name: true,
        slug: true,
        level: true,
        providerName: true,
      },
    },
    subject: { select: { id: true, name: true, code: true } },
    uploader: { select: { id: true, fullName: true } },
    reviews: { select: { rating: true } },
  };

  private canUpload(role: UserRole) {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.INSTITUTION_ADMIN,
        UserRole.LECTURER,
        UserRole.MODERATOR,
      ] as UserRole[]
    ).includes(role);
  }

  private canModerate(role: UserRole) {
    return (
      [
        UserRole.SUPER_ADMIN,
        UserRole.INSTITUTION_ADMIN,
        UserRole.MODERATOR,
      ] as UserRole[]
    ).includes(role);
  }

  async search(dto: SearchResourcesDto, userRole?: UserRole) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ResourceWhereInput = {
      status: ResourceStatus.PUBLISHED,
    };

    if (userRole && this.canModerate(userRole) && dto.programId) {
      // moderators can pass status filter via query - for now published only in search
    }

    if (dto.programId) where.programId = dto.programId;
    if (dto.educationLevel) where.educationLevel = dto.educationLevel as EducationLevel;
    if (dto.subjectId) where.subjectId = dto.subjectId;
    if (dto.type) where.type = dto.type;
    if (dto.year) where.year = dto.year;
    if (dto.q) {
      where.OR = [
        { title: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
        { author: { contains: dto.q, mode: 'insensitive' } },
        { tags: { has: dto.q.toLowerCase() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.resource.findMany({
        where,
        include: this.resourceInclude,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: data.map((r) => this.formatResource(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPending(userRole: UserRole) {
    if (!this.canModerate(userRole)) {
      throw new ForbiddenException();
    }
    const resources = await this.prisma.resource.findMany({
      where: { status: ResourceStatus.PENDING },
      include: this.resourceInclude,
      orderBy: { createdAt: 'asc' },
    });
    return resources.map((r) => this.formatResource(r));
  }

  async findById(id: string, userId?: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        ...this.resourceInclude,
        bookmarks: userId
          ? { where: { userId }, select: { userId: true } }
          : false,
      },
    });
    if (!resource) throw new NotFoundException('Resource not found');
    if (resource.status !== ResourceStatus.PUBLISHED) {
      throw new NotFoundException('Resource not found');
    }

    await this.prisma.resource.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      ...this.formatResource(resource),
      isBookmarked: userId
        ? (resource.bookmarks as { userId: string }[])?.length > 0
        : false,
    };
  }

  async create(dto: CreateResourceDto, userId: string, userRole: UserRole) {
    if (!this.canUpload(userRole)) {
      throw new ForbiddenException('You cannot upload resources');
    }

    const programId = dto.programId;
    let educationLevel: EducationLevel | undefined;

    if (programId) {
      const program = await this.prisma.program.findUnique({
        where: { id: programId },
      });
      if (!program) throw new BadRequestException('Invalid program');
      educationLevel = program.level;
    }

    const baseSlug = slugify(dto.title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const resource = await this.prisma.resource.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        type: dto.type,
        programId,
        educationLevel,
        subjectId: dto.subjectId,
        year: dto.year,
        semester: dto.semester,
        author: dto.author,
        tags: dto.tags ?? [],
        uploaderId: userId,
        status: ResourceStatus.DRAFT,
      },
      include: this.resourceInclude,
    });

    return this.formatResource(resource);
  }

  async update(
    id: string,
    dto: UpdateResourceDto,
    userId: string,
    userRole: UserRole,
  ) {
    const resource = await this.getEditableResource(id, userId, userRole);
    const updated = await this.prisma.resource.update({
      where: { id: resource.id },
      data: dto,
      include: this.resourceInclude,
    });
    return this.formatResource(updated);
  }

  async attachFile(
    id: string,
    file: Express.Multer.File,
    userId: string,
    userRole: UserRole,
  ) {
    const resource = await this.getEditableResource(id, userId, userRole);
    const program = resource.programId
      ? await this.prisma.program.findUnique({
          where: { id: resource.programId },
        })
      : null;

    const fileKey = this.storage.generateFileKey(
      program?.slug ?? 'general',
      resource.id,
      file.originalname,
    );

    await this.storage.saveLocal(fileKey, file.buffer);

    if (resource.fileKey) {
      await this.storage.deleteLocal(resource.fileKey);
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: {
        fileKey,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      include: this.resourceInclude,
    });
    return this.formatResource(updated);
  }

  async submitForReview(id: string, userId: string, userRole: UserRole) {
    const resource = await this.getEditableResource(id, userId, userRole);
    if (!resource.fileKey) {
      throw new BadRequestException('Upload a file before submitting');
    }
    const updated = await this.prisma.resource.update({
      where: { id },
      data: { status: ResourceStatus.PENDING },
      include: this.resourceInclude,
    });
    return this.formatResource(updated);
  }

  async moderate(id: string, dto: ModerateResourceDto, userRole: UserRole) {
    if (!this.canModerate(userRole)) throw new ForbiddenException();
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException();

    let status: ResourceStatus;
    let publishedAt: Date | undefined | null = null;
    let rejectionReason: string | null = null;

    switch (dto.action) {
      case 'approve':
        status = ResourceStatus.APPROVED;
        break;
      case 'publish':
        if (
          !(
            [ResourceStatus.PENDING, ResourceStatus.APPROVED] as ResourceStatus[]
          ).includes(resource.status)
        ) {
          throw new BadRequestException('Cannot publish from current status');
        }
        status = ResourceStatus.PUBLISHED;
        publishedAt = new Date();
        break;
      case 'reject':
        status = ResourceStatus.REJECTED;
        rejectionReason = dto.rejectionReason ?? 'Does not meet guidelines';
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data: { status, publishedAt, rejectionReason },
      include: this.resourceInclude,
    });
    return this.formatResource(updated);
  }

  async getDownload(id: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new NotFoundException();
    }
    if (!resource.fileKey || !this.storage.fileExists(resource.fileKey)) {
      throw new NotFoundException('File not available');
    }

    await this.prisma.$transaction([
      this.prisma.resource.update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      }),
      this.prisma.download.create({
        data: { userId, resourceId: id },
      }),
    ]);

    const apiBase =
      process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;

    return {
      downloadUrl: `${apiBase}/api/v1/library/resources/${id}/file`,
      fileName: resource.fileName,
      mimeType: resource.mimeType,
      fileSize: resource.fileSize,
    };
  }

  async streamFile(id: string, userId: string, res: Response) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new NotFoundException();
    }
    if (!resource.fileKey || !this.storage.fileExists(resource.fileKey)) {
      throw new NotFoundException('File not available');
    }

    const buffer = await this.storage.readLocal(resource.fileKey);
    res.setHeader(
      'Content-Type',
      resource.mimeType ?? 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${resource.fileName ?? 'download'}"`,
    );
    res.send(buffer);
  }

  async toggleBookmark(id: string, userId: string) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new NotFoundException();
    }

    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_resourceId: { userId, resourceId: id } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({
        where: { userId_resourceId: { userId, resourceId: id } },
      });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({ data: { userId, resourceId: id } });
    return { bookmarked: true };
  }

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: { resource: { include: this.resourceInclude } },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks
      .filter((b) => b.resource.status === ResourceStatus.PUBLISHED)
      .map((b) => this.formatResource(b.resource));
  }

  async addReview(id: string, dto: CreateReviewDto, userId: string) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.status !== ResourceStatus.PUBLISHED) {
      throw new NotFoundException();
    }

    await this.prisma.review.upsert({
      where: { userId_resourceId: { userId, resourceId: id } },
      create: {
        userId,
        resourceId: id,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: { rating: dto.rating, comment: dto.comment },
    });

    return { success: true };
  }

  async getMyUploads(userId: string) {
    const resources = await this.prisma.resource.findMany({
      where: { uploaderId: userId },
      include: this.resourceInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return resources.map((r) => this.formatResource(r));
  }

  private async getEditableResource(
    id: string,
    userId: string,
    userRole: UserRole,
  ) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException();
    const isOwner = resource.uploaderId === userId;
    const isAdmin = (
      [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN] as UserRole[]
    ).includes(userRole);
    if (!isOwner && !isAdmin) throw new ForbiddenException();
    if (
      ![ResourceStatus.DRAFT, ResourceStatus.REJECTED].includes(
        resource.status as 'DRAFT' | 'REJECTED',
      ) &&
      !isAdmin
    ) {
      throw new BadRequestException('Cannot edit resource in current status');
    }
    return resource;
  }

  private formatResource(
    resource: Prisma.ResourceGetPayload<{
      include: {
        program: {
          select: {
            id: true;
            name: true;
            slug: true;
            level: true;
            providerName: true;
          };
        };
        subject: { select: { id: true; name: true; code: true } };
        uploader: { select: { id: true; fullName: true } };
        reviews: { select: { rating: true } };
      };
    }>,
  ) {
    const ratings = resource.reviews ?? [];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : null;

    return {
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      type: resource.type,
      status: resource.status,
      program: resource.program,
      subject: resource.subject,
      year: resource.year,
      semester: resource.semester,
      author: resource.author,
      uploader: resource.uploader,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      mimeType: resource.mimeType,
      hasFile: !!resource.fileKey,
      downloadCount: resource.downloadCount,
      viewCount: resource.viewCount,
      tags: resource.tags,
      externalUrl: resource.externalUrl,
      sourceName: resource.sourceName,
      sourceCatalogUrl: resource.sourceCatalogUrl,
      attributionNotice: resource.attributionNotice,
      durationWeeks: resource.durationWeeks,
      avgRating,
      reviewCount: ratings.length,
      rejectionReason: resource.rejectionReason,
      publishedAt: resource.publishedAt?.toISOString() ?? null,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
    };
  }

  async classifyIngestPdf(
    file: Express.Multer.File,
    role: UserRole,
  ): Promise<IngestClassification> {
    if (!this.canUpload(role)) {
      throw new ForbiddenException('You do not have permission to ingest resources');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('PDF file is required');
    }
    const mime = file.mimetype || '';
    const name = file.originalname || 'document.pdf';
    if (mime !== 'application/pdf' && !name.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Only PDF files are supported for ingest');
    }

    this.gemini.ensureConfigured();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (
      data: Buffer,
    ) => Promise<{ text: string }>;
    const parsed = await pdfParse(file.buffer);
    const fullText = parsed.text?.trim() ?? '';
    if (!fullText) {
      throw new BadRequestException(
        'No text could be extracted from this PDF. Scanned image-only PDFs are not supported yet.',
      );
    }

    const maxChars = Number(process.env.AI_MAX_SOURCE_CHARS ?? 120_000);
    const excerpt = fullText.slice(0, Math.min(maxChars, 40_000));

    const systemPrompt = `You classify Zimbabwean education PDFs for the eFundo digital library.
Return ONLY valid JSON matching this schema:
{
  "type": one of ${INGEST_RESOURCE_TYPES.join(', ')},
  "title": string (clean human title, not the raw filename),
  "description": string | null,
  "author": string | null (institution, lecturer, or publisher if clear),
  "year": number | null (exam year or publication year),
  "semester": number | null (1 or 2 if tertiary),
  "suggestedSubjectCode": string | null (e.g. CS301, 4004),
  "suggestedSubjectName": string | null,
  "educationLevel": one of ${INGEST_LEVELS.join(', ')} | null,
  "tags": string[],
  "confidence": number between 0 and 1,
  "rationale": string (one short sentence)
}
Rules:
- PAST_PAPER: past exam / midterm / final papers, usually with questions and marks
- TEXTBOOK: long-form published book chapters or full books
- LECTURE_NOTE: course notes, handouts, slides-as-PDF notes
- Prefer TERTIARY for university codes like CS301; O_LEVEL/A_LEVEL for ZIMSEC-style papers
- If unsure between types, pick the closest and lower confidence`;

    const userPrompt = `File name: ${name}

PDF text (excerpt):
---
${excerpt}
---`;

    const raw = await this.gemini.generateJson(systemPrompt, userPrompt);
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('AI returned invalid JSON for classification');
    }

    const typeRaw = String(data.type ?? 'LECTURE_NOTE');
    const type = INGEST_RESOURCE_TYPES.includes(typeRaw as ResourceType)
      ? (typeRaw as ResourceType)
      : ResourceType.LECTURE_NOTE;

    const levelRaw = data.educationLevel != null ? String(data.educationLevel) : null;
    const educationLevel =
      levelRaw && INGEST_LEVELS.includes(levelRaw as EducationLevel)
        ? (levelRaw as EducationLevel)
        : null;

    const title =
      typeof data.title === 'string' && data.title.trim().length >= 3
        ? data.title.trim().slice(0, 200)
        : name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() ||
          'Untitled resource';

    const confidenceNum = Number(data.confidence);
    const confidence = Number.isFinite(confidenceNum)
      ? Math.min(1, Math.max(0, confidenceNum))
      : 0.5;

    const yearNum = data.year != null ? Number(data.year) : null;
    const semesterNum = data.semester != null ? Number(data.semester) : null;
    const tags = Array.isArray(data.tags)
      ? data.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
      : [];

    return {
      type,
      title,
      description:
        typeof data.description === 'string'
          ? data.description.trim().slice(0, 2000)
          : null,
      author:
        typeof data.author === 'string' ? data.author.trim().slice(0, 200) : null,
      year:
        yearNum != null &&
        Number.isFinite(yearNum) &&
        yearNum >= 1990 &&
        yearNum <= 2100
          ? Math.round(yearNum)
          : null,
      semester: semesterNum === 1 || semesterNum === 2 ? semesterNum : null,
      suggestedSubjectCode:
        typeof data.suggestedSubjectCode === 'string'
          ? data.suggestedSubjectCode.trim().slice(0, 40)
          : null,
      suggestedSubjectName:
        typeof data.suggestedSubjectName === 'string'
          ? data.suggestedSubjectName.trim().slice(0, 120)
          : null,
      educationLevel,
      tags,
      confidence,
      rationale:
        typeof data.rationale === 'string'
          ? data.rationale.trim().slice(0, 500)
          : null,
      textPreview: fullText.slice(0, 600),
      fileName: name,
    };
  }
}
