import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ConfessionsService } from './confessions.service';
import { ConfessionQueryDto, CreateConfessionDto } from './dto/confession.dto';
import { UpdateConfessionStatusDto } from './dto/confession-status.dto';

@Controller('confessions')
export class ConfessionsController {
  constructor(private readonly confessionsService: ConfessionsService) {}

  @Get()
  list(@Query(new ValidationPipe({ whitelist: true, transform: true })) query: ConfessionQueryDto) {
    return this.confessionsService.list(query);
  }

  @Post()
  create(@Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateConfessionDto) {
    return this.confessionsService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateConfessionStatusDto,
  ) {
    return this.confessionsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('code') code?: string) {
    return this.confessionsService.remove(id, code);
  }
}
