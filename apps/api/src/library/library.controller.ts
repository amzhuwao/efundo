import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ModerateResourceDto,
  CreateReviewDto,
  SearchResourcesDto,
} from './dto/library.dto';

@ApiTags('library')
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('resources')
  @ApiOperation({ summary: 'Search published resources' })
  search(@Query() dto: SearchResourcesDto) {
    return this.libraryService.search(dto);
  }

  @Get('resources/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List resources pending moderation' })
  pending(@Request() req: { user: { role: UserRole } }) {
    return this.libraryService.findPending(req.user.role);
  }

  @Get('resources/my-uploads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my uploads' })
  myUploads(@Request() req: { user: { id: string } }) {
    return this.libraryService.getMyUploads(req.user.id);
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List bookmarked resources' })
  bookmarks(@Request() req: { user: { id: string } }) {
    return this.libraryService.getBookmarks(req.user.id);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Get resource details' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } },
  ) {
    return this.libraryService.findById(id, req.user?.id);
  }

  @Post('resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create resource metadata (draft)' })
  create(
    @Body() dto: CreateResourceDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.libraryService.create(dto, req.user.id, req.user.role);
  }

  @Patch('resources/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resource metadata' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.libraryService.update(id, dto, req.user.id, req.user.role);
  }

  @Post('resources/:id/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload resource file' })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 })],
      }),
    )
    file: Express.Multer.File,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.libraryService.attachFile(id, file, req.user.id, req.user.role);
  }

  @Post('resources/:id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit resource for moderation' })
  submit(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.libraryService.submitForReview(id, req.user.id, req.user.role);
  }

  @Post('resources/:id/moderate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve, reject, or publish resource' })
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateResourceDto,
    @Request() req: { user: { role: UserRole } },
  ) {
    return this.libraryService.moderate(id, dto, req.user.role);
  }

  @Post('resources/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get download URL and track download' })
  download(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.libraryService.getDownload(id, req.user.id);
  }

  @Post('resources/:id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle bookmark' })
  bookmark(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.libraryService.toggleBookmark(id, req.user.id);
  }

  @Post('resources/:id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate and review resource' })
  review(
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.libraryService.addReview(id, dto, req.user.id);
  }

  @Get('resources/:id/file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream resource file' })
  streamFile(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    return this.libraryService.streamFile(id, req.user.id, res);
  }
}
