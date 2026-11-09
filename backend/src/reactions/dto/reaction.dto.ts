import { ReactionType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateReactionDto {
  @IsEnum(ReactionType)
  type!: ReactionType;

  @IsOptional()
  @IsString()
  deviceHash?: string;
}
