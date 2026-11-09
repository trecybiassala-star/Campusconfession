import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(confessionId: string) {
    const confession = await this.prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      throw new NotFoundException('La confession n’existe pas.');
    }

    const comments = await this.prisma.comment.findMany({
      where: { confessionId },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      confessionId: comment.confessionId,
      content: comment.content,
      alias: comment.alias ?? 'Anonyme',
      createdAt: comment.createdAt,
    }));
  }

  async create(confessionId: string, dto: CreateCommentDto) {
    const confession = await this.prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      throw new NotFoundException('La confession n’existe pas.');
    }

    const content = dto.content.trim();
    const comment = await this.prisma.comment.create({
      data: {
        confessionId,
        content,
        alias: dto.alias?.trim() || 'Anonyme',
        deviceHash: dto.deviceHash ?? `comment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      },
    });

    return {
      id: comment.id,
      confessionId: comment.confessionId,
      content: comment.content,
      alias: comment.alias ?? 'Anonyme',
      createdAt: comment.createdAt,
    };
  }
}
