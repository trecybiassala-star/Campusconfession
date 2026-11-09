import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { CreateCampusDto } from './dto/campus.dto';
import { CampusesService } from './campuses.service';

@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  list() {
    return this.campusesService.list();
  }

  @Post()
  create(@Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateCampusDto) {
    return this.campusesService.create(dto);
  }
}
