import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export enum MeetingStatus {
  RECRUITING = 'recruiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MissionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class GetMeetingsQueryDto {
  @ApiPropertyOptional({
    enum: MeetingStatus,
    description: '모임 상태 필터',
    default: 'recruiting',
  })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus = MeetingStatus.RECRUITING;

  @ApiPropertyOptional({ description: '카테고리 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '지역구 ID' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({
    enum: MissionDifficulty,
    description: '미션 난이도',
  })
  @IsOptional()
  @IsEnum(MissionDifficulty)
  difficulty?: MissionDifficulty;

  @ApiPropertyOptional({
    description: '검색 키워드 (제목, 설명, 해시태그에서 검색)',
  })
  @IsOptional()
  @IsString()
  searchKeyword?: string;

  @ApiPropertyOptional({
    enum: ['latest', 'deadline', 'popular'],
    description: '정렬 기준',
    default: 'latest',
  })
  @IsOptional()
  @IsEnum(['latest', 'deadline', 'popular'])
  sortBy?: 'latest' | 'deadline' | 'popular' = 'latest';

  // 주간/날짜 필터링
  @ApiPropertyOptional({
    description: '주간 시작 날짜 (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  weekStartDate?: string;

  @ApiPropertyOptional({
    description: '주간 종료 날짜 (ISO 8601)',
    example: '2024-01-07T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  weekEndDate?: string;

  @ApiPropertyOptional({
    description: '특정 날짜 선택 (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  selectedDate?: string;

  @ApiPropertyOptional({ description: '특정 미션의 모임만 조회' })
  @IsOptional()
  @IsString()
  missionId?: string;

  // 페이지네이션 (6개씩)
  @ApiPropertyOptional({
    default: 1,
    minimum: 1,
    description: '페이지 번호',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 6,
    minimum: 1,
    maximum: 20,
    description: '페이지당 모임 수 (기본 6개)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  size?: number = 6;
}
