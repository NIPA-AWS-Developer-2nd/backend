import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum DifficultyEnum {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class GetMissionsQueryDto {
  @ApiProperty({
    description: '카테고리 필터 (all 또는 특정 카테고리명)',
    required: false,
    example: 'culture',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: '난이도 필터',
    required: false,
    enum: DifficultyEnum,
    example: DifficultyEnum.HARD,
  })
  @IsOptional()
  @IsEnum(DifficultyEnum)
  difficulty?: DifficultyEnum;

  @ApiProperty({
    description: '참여인원 필터 (medium: 4-6명, large: 7명 이상)',
    required: false,
    example: 'medium',
  })
  @IsOptional()
  @IsString()
  participants?: string;

  @ApiProperty({
    description: '예상시간 필터 (short: 90분 이하, medium: 90-180분, long: 180분 초과)',
    required: false,
    example: 'long',
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({
    description: '포인트 범위 필터 (low: 400P 미만, medium: 400-799P, high: 800P 이상)',
    required: false,
    example: 'high',
  })
  @IsOptional()
  @IsString()
  point?: string;

  @ApiProperty({
    description: '페이지 번호 (기본값: 1)',
    required: false,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: '페이지당 항목 수 (기본값: 5, 최대: 100)',
    required: false,
    example: 5,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 5;
}