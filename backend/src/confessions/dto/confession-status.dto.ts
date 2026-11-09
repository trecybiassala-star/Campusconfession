import { ConfessionStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateConfessionStatusDto {
  @IsEnum(ConfessionStatus)
  status!: ConfessionStatus;
}
