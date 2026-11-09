import { ReportMotif } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportMotif)
  motif!: ReportMotif;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  detail?: string;

  @IsOptional()
  @IsString()
  deviceHash?: string;
}
