import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BlogPostStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize<
    T extends {
      publishedAt: Date;
      createdAt: Date;
      updatedAt: Date;
      sections: Prisma.JsonValue;
    },
  >(post: T) {
    return {
      ...post,
      sections: post.sections,
      publishedAt:
        post.publishedAt instanceof Date
          ? post.publishedAt.toISOString().slice(0, 10)
          : post.publishedAt,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private normalizeSlug(slug: string) {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async listPublished(category?: string) {
    const posts = await this.prisma.blogPost.findMany({
      where: {
        status: BlogPostStatus.PUBLISHED,
        ...(category ? { category } : {}),
      },
      orderBy: { publishedAt: 'desc' },
    });
    return posts.map((p) => this.serialize(p));
  }

  async getPublishedBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: BlogPostStatus.PUBLISHED },
    });
    if (!post) throw new NotFoundException('Post not found');
    return this.serialize(post);
  }

  async adminList() {
    const posts = await this.prisma.blogPost.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return posts.map((p) => this.serialize(p));
  }

  async adminGet(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return this.serialize(post);
  }

  async create(dto: CreateBlogPostDto) {
    const slug = this.normalizeSlug(dto.slug);
    if (!slug) throw new BadRequestException('Invalid slug');

    const existing = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Slug already in use');

    const post = await this.prisma.blogPost.create({
      data: {
        slug,
        title: dto.title.trim(),
        excerpt: dto.excerpt.trim(),
        category: dto.category.trim(),
        author: dto.author?.trim() || 'eFundo Team',
        readTimeMinutes: dto.readTimeMinutes ?? 5,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        status: dto.status ?? BlogPostStatus.DRAFT,
        sections: dto.sections as unknown as Prisma.InputJsonValue,
      },
    });
    return this.serialize(post);
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');

    let slug = existing.slug;
    if (dto.slug !== undefined) {
      slug = this.normalizeSlug(dto.slug);
      if (!slug) throw new BadRequestException('Invalid slug');
      if (slug !== existing.slug) {
        const clash = await this.prisma.blogPost.findUnique({ where: { slug } });
        if (clash) throw new ConflictException('Slug already in use');
      }
    }

    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        slug,
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt.trim() } : {}),
        ...(dto.category !== undefined ? { category: dto.category.trim() } : {}),
        ...(dto.author !== undefined ? { author: dto.author.trim() } : {}),
        ...(dto.readTimeMinutes !== undefined
          ? { readTimeMinutes: dto.readTimeMinutes }
          : {}),
        ...(dto.publishedAt !== undefined
          ? { publishedAt: new Date(dto.publishedAt) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sections !== undefined
          ? { sections: dto.sections as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });
    return this.serialize(post);
  }

  async remove(id: string) {
    const existing = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: 'Post deleted' };
  }
}
