import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, ResourceStatus, UserRole, EducationLevel } from '@prisma/client';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ModerateResourceDto,
  CreateReviewDto,
  SearchResourcesDto,
} from './dto/library.dto';

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
}
