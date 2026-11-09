import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto } from './dto/reaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(confessionId: string, dto: CreateReactionDto) {
    const confession = await this.prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      throw new NotFoundException('La confession n’existe pas.');
    }

    const deviceHash = dto.deviceHash ?? `browser-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const reaction = await this.prisma.reaction.upsert({
      where: {
        confessionId_deviceHash: {
          confessionId,
          deviceHash,
        },
      },
      update: {
        type: dto.type,
      },
      create: {
        confessionId,
        deviceHash,
        type: dto.type,
      },
    });

    const counts = await this.prisma.reaction.groupBy({
      by: ['type'],
      where: { confessionId },
      _count: {
        type: true,
      },
    });

    return {
      id: reaction.id,
      confessionId,
      deviceHash,
      type: reaction.type,
      total: await this.prisma.reaction.count({ where: { confessionId } }),
      counts: counts.map((entry) => ({
        type: entry.type as ReactionType,
        count: entry._count.type,
      })),
    };
  }
}
