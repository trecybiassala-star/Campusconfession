import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampusDto } from './dto/campus.dto';

@Injectable()
export class CampusesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.campus.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateCampusDto) {
    const slug = dto.slug.trim();
    if (!slug) {
      throw new BadRequestException('Le slug du campus est requis.');
    }

    const existing = await this.prisma.campus.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Ce campus existe déjà.');
    }

    return this.prisma.campus.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() ?? null,
        rules: dto.rules?.trim() ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }
}
