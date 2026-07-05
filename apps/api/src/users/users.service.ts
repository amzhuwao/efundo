import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          educationLevel: true,
          programId: true,
          year: true,
          createdAt: true,
          program: { select: { name: true, providerName: true, level: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminUpdate(userId: string, dto: AdminUpdateUserDto, actorRole: UserRole) {
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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return { ...updated, createdAt: updated.createdAt.toISOString() };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        program: true,
        favouriteSubjects: { include: { subject: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
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

    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        program: true,
        favouriteSubjects: { include: { subject: true } },
      },
    });
  }
}
