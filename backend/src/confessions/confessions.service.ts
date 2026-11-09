import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ConfessionCategory, ConfessionStatus, ConfessionType } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfessionQueryDto, CreateConfessionDto } from './dto/confession.dto';

@Injectable()
export class ConfessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ConfessionQueryDto) {
    const where: Prisma.ConfessionWhereInput = {
      status: query.status ? (query.status as ConfessionStatus) : ConfessionStatus.PUBLISHED,
    };

    if (query.campusId) {
      where.campusId = query.campusId;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { content: { contains: term, mode: 'insensitive' } },
        { maskedContent: { contains: term, mode: 'insensitive' } },
      ];
    }

    const pageSize = Math.min(Number(query.pageSize ?? 10), 50);
    const take = pageSize;

    const items = await this.prisma.confession.findMany({
      where,
      take,
      ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
      orderBy:
        query.sort === 'oldest' ? { createdAt: 'asc' } : query.sort === 'popular'
          ? [{ reactions: { _count: 'desc' } }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
      include: {
        campus: true,
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    return items.map((confession) => this.serialize(confession));
  }

  async create(dto: CreateConfessionDto) {
    const content = dto.content.trim();
    if (!content.length) {
      throw new BadRequestException('Le contenu de la confession est requis.');
    }

    let campus: any = null;
    if (dto.campusId) {
      campus = await this.prisma.campus.findUnique({ where: { id: dto.campusId } });
    }

    if (!campus && dto.campusId) {
      campus = await this.prisma.campus.upsert({
        where: { slug: dto.campusId },
        update: {},
        create: {
          id: dto.campusId,
          name: dto.campusId,
          slug: dto.campusId,
          description: 'Campus créé automatiquement pour les tests et les démonstrations.',
        },
      });
    }

    if (!campus) {
      campus = await this.prisma.campus.findFirst({
        where: { isActive: true },
      });
    }

    if (!campus) {
      campus = await this.prisma.campus.create({
        data: {
          name: 'Campus principal',
          slug: 'campus-principal',
          description: 'Campus principal de CampusConfessions.',
        },
      });
    }

    const selectedCampus = campus as any;
    const deletionCode = this.generateDeletionCode();
    const created = await this.prisma.confession.create({
      data: {
        campusId: selectedCampus.id,
        content,
        maskedContent: content,
        category: (dto.category ?? ConfessionCategory.OMG) as ConfessionCategory,
        mood: dto.mood ?? 'anonyme',
        type: dto.type ?? ConfessionType.NORMAL,
        status: ConfessionStatus.PUBLISHED,
        deviceHash: `demo-device-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        deletionCodeHash: this.hashCode(deletionCode),
        riskScore: 0,
        searchVector: content,
      },
      include: {
        campus: true,
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    return {
      ...this.serialize(created),
      deletionCode,
    };
  }

  async updateStatus(id: string, status: ConfessionStatus) {
    const confession = await this.prisma.confession.findUnique({ where: { id } });

    if (!confession) {
      throw new NotFoundException('La confession n’a pas été trouvée.');
    }

    const nextStatus = status ?? confession.status;
    const maskedMessage = 'Cette confession a été masquée par la modération.';

    const updated = await this.prisma.confession.update({
      where: { id },
      data: {
        status: nextStatus,
        maskedContent: nextStatus === ConfessionStatus.MASKED ? maskedMessage : confession.maskedContent ?? confession.content,
        content: nextStatus === ConfessionStatus.MASKED ? maskedMessage : confession.content,
      },
      include: {
        campus: true,
        _count: {
          select: { reactions: true, comments: true },
        },
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string, code?: string) {
    const confession = await this.prisma.confession.findUnique({
      where: { id },
    });

    if (!confession) {
      throw new NotFoundException('La confession n’a pas été trouvée.');
    }

    if (!confession.deletionCodeHash) {
      throw new ForbiddenException('Cette confession n’a pas de code de suppression.');
    }

    if (code && this.hashCode(code) !== confession.deletionCodeHash) {
      throw new ForbiddenException('Le code de suppression ne correspond pas.');
    }

    if (!code) {
      throw new ForbiddenException('Le code de suppression est requis.');
    }

    await this.prisma.confession.update({
      where: { id },
      data: {
        status: ConfessionStatus.DELETED,
      },
    });

    return { success: true, deleted: true, id };
  }

  private serialize(confession: any) {
    return {
      id: confession.id,
      campusId: confession.campusId,
      campus: confession.campus ? { id: confession.campus.id, name: confession.campus.name, slug: confession.campus.slug } : null,
      content: confession.content,
      maskedContent: confession.maskedContent ?? confession.content,
      category: confession.category,
      mood: confession.mood,
      type: confession.type,
      status: confession.status,
      riskScore: confession.riskScore,
      createdAt: confession.createdAt,
      updatedAt: confession.updatedAt,
      reactionCount: confession._count?.reactions ?? 0,
      commentCount: confession._count?.comments ?? 0,
    };
  }

  private generateDeletionCode() {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  }

  private hashCode(code: string) {
    return crypto.createHash('sha256').update(code.trim()).digest('hex');
  }
}
