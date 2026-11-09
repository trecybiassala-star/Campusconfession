import { Module } from '@nestjs/common';
import { ReportStatusController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController, ReportStatusController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
