import { Body, Controller, Get, Param, Patch, Post, Query, ValidationPipe } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { CreateReportDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/report-status.dto';
import { ReportsService } from './reports.service';

@Controller('confessions')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('reports')
  list() {
    return this.reportsService.list();
  }

  @Post(':id/reports')
  create(
    @Param('id') confessionId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateReportDto,
  ) {
    return this.reportsService.create(confessionId, dto);
  }
}

@Controller('reports')
export class ReportStatusController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(@Query('status') status?: string, @Query('campusId') campusId?: string) {
    return this.reportsService.list({
      status: status ? (status as ReportStatus) : undefined,
      campusId,
    });
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') reportId: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: UpdateReportStatusDto,
  ) {
    return this.reportsService.updateStatus(reportId, dto.status);
  }
}
