import { ConfessionCategory, ConfessionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateConfessionDto {
  @IsOptional()
  @IsString()
  campusId?: string;

  @IsString()
  @Length(10, 2000)
  content!: string;

  @IsOptional()
  @IsString()
  mood?: string;

  @IsEnum(ConfessionCategory)
  category!: ConfessionCategory;

  @IsOptional()
  @IsEnum(ConfessionType)
  type?: ConfessionType = ConfessionType.NORMAL;
}

export class ConfessionQueryDto {
  @IsOptional()
  @IsString()
  campusId?: string;

  @IsOptional()
  @IsEnum(ConfessionCategory)
  category?: ConfessionCategory;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  sort?: 'latest' | 'oldest' | 'popular';
}
