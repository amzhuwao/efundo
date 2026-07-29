import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole, UserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const profileInclude = {
  program: true,
  favouriteSubjects: { include: { subject: true } },
} satisfies Prisma.UserInclude;

const adminSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  avatarUrl: true,
  educationLevel: true,
  programId: true,
  year: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  program: { select: { name: true, providerName: true, level: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize<T extends { passwordHash?: string; createdAt?: Date; updatedAt?: Date }>(
    user: T,
  ) {
    const { passwordHash: _, ...safe } = user;
    return {
      ...safe,
      ...(user.createdAt instanceof Date
        ? { createdAt: user.createdAt.toISOString() }
        : {}),
      ...(user.updatedAt instanceof Date
        ? { updatedAt: user.updatedAt.toISOString() }
        : {}),
    };
  }

  async findAll(page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: adminSelect,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.sanitize(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: profileInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { subjectIds, ...data } = dto;

    if (subjectIds !== undefined) {
      await this.prisma.userSubject.deleteMany({ where: { userId } });
      if (subjectIds.length > 0) {
        await this.prisma.userSubject.createMany({
          data: subjectIds.map((subjectId) => ({ userId, subjectId })),
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.avatarUrl !== undefined
          ? { avatarUrl: data.avatarUrl === '' ? null : data.avatarUrl }
          : {}),
        ...(data.educationLevel !== undefined
          ? { educationLevel: data.educationLevel }
          : {}),
        ...(data.programId !== undefined
          ? { programId: data.programId === '' ? null : data.programId }
          : {}),
        ...(data.year !== undefined ? { year: data.year } : {}),
      },
      include: profileInclude,
    });
    return this.sanitize(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: 'Password updated' };
  }

  async deleteAccount(userId: string) {
    await this.deleteUserInternal(userId);
    return { message: 'Account deleted' };
  }

  async adminCreate(dto: AdminCreateUserDto, actorRole: UserRole) {
    if (
      dto.role === UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only super admins can create super admins');
    }

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role ?? UserRole.STUDENT,
        status: dto.status ?? UserStatus.ACTIVE,
        educationLevel: dto.educationLevel,
        programId: dto.programId || undefined,
        year: dto.year,
        emailVerified: true,
      },
      select: adminSelect,
    });
    return this.sanitize(user);
  }

  async adminUpdate(
    userId: string,
    dto: AdminUpdateUserDto,
    actorRole: UserRole,
    actorId: string,
  ) {
    if (
      actorRole !== UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.INSTITUTION_ADMIN
    ) {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      dto.role === UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only super admins can assign super admin role');
    }

    if (
      user.role === UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only super admins can edit super admins');
    }

    if (userId === actorId && dto.role && dto.role !== user.role) {
      throw new BadRequestException('You cannot change your own role');
    }

    if (userId === actorId && dto.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('You cannot suspend your own account');
    }

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const data: Prisma.UserUncheckedUpdateInput = {};
    if (dto.email !== undefined) data.email = dto.email.toLowerCase();
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.avatarUrl !== undefined) {
      data.avatarUrl = dto.avatarUrl === '' ? null : dto.avatarUrl;
    }
    if (dto.educationLevel !== undefined) data.educationLevel = dto.educationLevel;
    if (dto.programId !== undefined) {
      data.programId = dto.programId === '' ? null : dto.programId;
    }
    if (dto.year !== undefined) data.year = dto.year;
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: adminSelect,
    });
    return this.sanitize(updated);
  }

  async adminDelete(userId: string, actorRole: UserRole, actorId: string) {
    if (userId === actorId) {
      throw new BadRequestException('You cannot delete your own account here');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      user.role === UserRole.SUPER_ADMIN &&
      actorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only super admins can delete super admins');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      const count = await this.prisma.user.count({
        where: { role: UserRole.SUPER_ADMIN },
      });
      if (count <= 1) {
        throw new BadRequestException('Cannot delete the last super admin');
      }
    }

    await this.deleteUserInternal(userId);
    return { message: 'User deleted' };
  }

  private async deleteUserInternal(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$transaction([
      this.prisma.resource.updateMany({
        where: { uploaderId: userId },
        data: { uploaderId: null },
      }),
      this.prisma.lesson.updateMany({
        where: { authorId: userId },
        data: { authorId: null },
      }),
      this.prisma.question.updateMany({
        where: { authorId: userId },
        data: { authorId: null },
      }),
      this.prisma.quiz.updateMany({
        where: { authorId: userId },
        data: { authorId: null },
      }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);
  }
}
