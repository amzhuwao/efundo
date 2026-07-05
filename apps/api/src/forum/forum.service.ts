import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscussionDto, CreateCommentDto } from './dto/forum.dto';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  async listDiscussions(subjectId?: string) {
    return this.prisma.discussion.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true, code: true } },
        _count: { select: { comments: true } },
      },
      take: 50,
    });
  }

  async getDiscussion(id: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true, code: true } },
        comments: {
          orderBy: [{ isAccepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
          include: {
            author: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    if (!discussion) throw new NotFoundException();

    await this.prisma.discussion.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return discussion;
  }

  async createDiscussion(dto: CreateDiscussionDto, userId: string) {
    return this.prisma.discussion.create({
      data: {
        subjectId: dto.subjectId,
        authorId: userId,
        title: dto.title,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, fullName: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async addComment(discussionId: string, dto: CreateCommentDto, userId: string) {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
    });
    if (!discussion) throw new NotFoundException();

    return this.prisma.comment.create({
      data: {
        discussionId,
        authorId: userId,
        body: dto.body,
      },
      include: {
        author: { select: { id: true, fullName: true } },
      },
    });
  }

  async upvoteComment(commentId: string) {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { upvotes: { increment: 1 } },
    });
  }

  async acceptComment(
    commentId: string,
    userId: string,
    role: UserRole,
  ) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { discussion: true },
    });
    if (!comment) throw new NotFoundException();

    const isAuthor = comment.discussion.authorId === userId;
    const isMod = (
      [UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR] as UserRole[]
    ).includes(role);
    if (!isAuthor && !isMod) throw new ForbiddenException();

    await this.prisma.comment.updateMany({
      where: { discussionId: comment.discussionId },
      data: { isAccepted: false },
    });

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { isAccepted: true },
    });
  }
}
