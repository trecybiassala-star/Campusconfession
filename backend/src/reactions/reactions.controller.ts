import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateReactionDto } from './dto/reaction.dto';
import { ReactionsService } from './reactions.service';

@Controller('confessions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':id/reactions')
  create(@Param('id') confessionId: string, @Body() dto: CreateReactionDto) {
    return this.reactionsService.upsert(confessionId, dto);
  }
}
