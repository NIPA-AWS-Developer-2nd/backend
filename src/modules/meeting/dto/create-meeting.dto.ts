import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMeetingTraitDto {
  @ApiProperty({
    description: '선호하는 참가자 특성 ID',
    example: 'trait_001',
  })
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class CreateMeetingDto {
  @ApiProperty({
    description: '미션 ID',
    example: '01HQXXX1234567890123456789',
  })
  @IsString()
  @IsNotEmpty()
  missionId: string;

  @ApiProperty({
    description: '모집 마감 일시 (자동 계산됨)',
    example: '2024-12-15T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  recruitUntil?: string;

  @ApiProperty({
    description: '미션 수행 예정 일시',
    example: '2024-12-16T14:00:00.000Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({
    description: '참가자 수 (호스트 포함)',
    example: 4,
    minimum: 2,
    maximum: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  participants?: number;

  @ApiProperty({
    description: '모임 소개 메시지',
    example: '함께 재미있게 미션을 수행해요! 초보자도 환영합니다.',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  introduction?: string;

  @ApiProperty({
    description: '집중도 점수 (1-100)',
    example: 70,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  focusScore?: number;

  @ApiProperty({
    description: '선호하는 참가자 특성 목록',
    type: [CreateMeetingTraitDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMeetingTraitDto)
  traits?: CreateMeetingTraitDto[];
}
