import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ForumService } from './forum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDiscussionDto, CreateCommentDto } from './dto/forum.dto';

@ApiTags('forum')
@Controller('forum')
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  @Get('discussions')
  @ApiOperation({ summary: 'List discussions' })
  list(@Query('subjectId') subjectId?: string) {
    return this.forumService.listDiscussions(subjectId);
  }

  @Get('discussions/:id')
  @ApiOperation({ summary: 'Get discussion with comments' })
  getOne(@Param('id') id: string) {
    return this.forumService.getDiscussion(id);
  }

  @Post('discussions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a discussion' })
  create(
    @Body() dto: CreateDiscussionDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.forumService.createDiscussion(dto, req.user.id);
  }

  @Post('discussions/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a discussion' })
  comment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.forumService.addComment(id, dto, req.user.id);
  }

  @Post('comments/:id/upvote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upvote a comment' })
  upvote(@Param('id') id: string) {
    return this.forumService.upvoteComment(id);
  }

  @Post('comments/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark comment as accepted answer' })
  accept(
    @Param('id') id: string,
    @Request() req: { user: { id: string; role: UserRole } },
  ) {
    return this.forumService.acceptComment(id, req.user.id, req.user.role);
  }
}
