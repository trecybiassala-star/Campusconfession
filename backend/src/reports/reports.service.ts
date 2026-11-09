import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(confessionId: string, dto: CreateReportDto) {
    const confession = await this.prisma.confession.findUnique({ where: { id: confessionId } });

    if (!confession) {
      throw new NotFoundException('La confession n’existe pas.');
    }

    const report = await this.prisma.report.create({
      data: {
        targetType: 'CONFESSION',
        targetId: confessionId,
        confessionId,
        motif: dto.motif,
        detail: dto.detail ?? null,
        deviceHash: dto.deviceHash ?? `report-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: ReportStatus.OPEN,
      },
    });

    return {
      id: report.id,
      confessionId: report.confessionId,
      targetType: report.targetType,
      motif: report.motif,
      detail: report.detail,
      status: report.status,
      createdAt: report.createdAt,
    };
  }

  async list(filters?: { status?: ReportStatus; campusId?: string }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.campusId) {
      where.confession = {
        campusId: filters.campusId,
      };
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        confession: {
          include: {
            campus: true,
          },
        },
      },
    });

    return reports.map((report) => ({
      id: report.id,
      confessionId: report.confessionId,
      motif: report.motif,
      status: report.status,
      detail: report.detail,
      createdAt: report.createdAt,
      campusId: report.confession?.campusId ?? null,
      campus: report.confession?.campus
        ? {
            id: report.confession.campus.id,
            name: report.confession.campus.name,
            slug: report.confession.campus.slug,
          }
        : null,
      confession: report.confession
        ? {
            id: report.confession.id,
            content: report.confession.content,
          }
        : null,
    }));
  }

  async updateStatus(reportId: string, status: ReportStatus) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Le signalement n’existe pas.');
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return {
      id: updatedReport.id,
      confessionId: updatedReport.confessionId,
      motif: updatedReport.motif,
      detail: updatedReport.detail,
      status: updatedReport.status,
      createdAt: updatedReport.createdAt,
    };
  }
}
