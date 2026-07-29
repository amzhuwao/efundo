import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BlogService } from './blog.service';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @ApiOperation({ summary: 'List published blog posts' })
  listPublished(@Query('category') category?: string) {
    return this.blogService.listPublished(category);
  }

  @Get('admin/posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'List all blog posts (admin)' })
  adminList() {
    return this.blogService.adminList();
  }

  @Get('admin/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Get blog post by id (admin)' })
  adminGet(@Param('id') id: string) {
    return this.blogService.adminGet(id);
  }

  @Post('admin/posts')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Create blog post (admin)' })
  create(@Body() dto: CreateBlogPostDto) {
    return this.blogService.create(dto);
  }

  @Patch('admin/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Update blog post (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete('admin/posts/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: 'Delete blog post (admin)' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published blog post by slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.blogService.getPublishedBySlug(slug);
  }
}
