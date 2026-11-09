import { Body, Controller, Get, Param, Post, ValidationPipe } from '@nestjs/common';
import { CreateCommentDto } from './dto/comment.dto';
import { CommentsService } from './comments.service';

@Controller('confessions')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  findAll(@Param('id') confessionId: string) {
    return this.commentsService.list(confessionId);
  }

  @Post(':id/comments')
  create(
    @Param('id') confessionId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateCommentDto,
  ) {
    return this.commentsService.create(confessionId, dto);
  }
}
