import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { StorageModule } from './storage/storage.module';
import { LibraryModule } from './library/library.module';
import { LmsModule } from './lms/lms.module';
import { ForumModule } from './forum/forum.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CurriculumModule,
    LibraryModule,
    LmsModule,
    ForumModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
