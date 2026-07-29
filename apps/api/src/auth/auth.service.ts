import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitizeUser(user), tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user || user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException();
      }
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return { user: this.sanitizeUser(user), tokens };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return the same message to avoid account enumeration.
    const message =
      'If an account exists for that email, we sent password reset instructions.';

    if (!user || user.status === UserStatus.SUSPENDED) {
      return { message };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const webUrl = (this.config.get<string>('WEB_URL') ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const resetUrl = `${webUrl}/reset-password?token=${token}`;

    try {
      await this.mail.sendPasswordReset(user.email, resetUrl);
    } catch (err) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}`,
        err instanceof Error ? err.stack : undefined,
      );
      // Clear token so a failed send does not leave a usable reset pending silently.
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      throw new BadRequestException(
        'Could not send reset email. Please try again later.',
      );
    }

    return { message };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token.trim());
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('Account suspended');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Password updated. You can sign in with your new password.' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessSecret = this.config.getOrThrow<string>('JWT_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpires = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
      this.jwt.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpires as `${number}${'s' | 'm' | 'h' | 'd'}`,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    avatarUrl: string | null;
    educationLevel: string | null;
    programId: string | null;
    year: number | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      educationLevel: user.educationLevel,
      programId: user.programId,
      year: user.year,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
