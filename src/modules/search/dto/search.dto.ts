import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

// 미션 검색 DTO
export class SearchMissionsDto {
  @ApiPropertyOptional({ description: '카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiPropertyOptional({ description: '최소 소요시간(분)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minDuration?: number;

  @ApiPropertyOptional({ description: '최대 소요시간(분)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(600)
  maxDuration?: number;

  @ApiPropertyOptional({ description: '최소 참여인원' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minParticipants?: number;

  @ApiPropertyOptional({ description: '최대 참여인원' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(50)
  maxParticipants?: number;

  @ApiPropertyOptional({ description: '최소 포인트' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPoints?: number;

  @ApiPropertyOptional({ description: '최대 포인트' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Max(10000)
  maxPoints?: number;

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @ApiPropertyOptional({ enum: ['latest', 'popular', 'points'] })
  @IsOptional()
  @IsEnum(['latest', 'popular', 'points'])
  sort?: 'latest' | 'popular' | 'points' = 'latest';
}

// 모임 검색 DTO
export class SearchMeetingsDto {
  @ApiPropertyOptional({ description: '시작 날짜 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: '종료 날짜 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: '위도' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: '경도' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: '최대 거리(km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDistance?: number;

  @ApiPropertyOptional({ description: '지역구' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: '최소 남은 자리' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minAvailableSeats?: number;

  @ApiPropertyOptional({ description: '최소 집중도 점수 (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  minFocusScore?: number;

  @ApiPropertyOptional({ description: '최대 집중도 점수 (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxFocusScore?: number;

  @ApiPropertyOptional({ description: '미션 ID' })
  @IsOptional()
  @IsString()
  missionId?: string;

  @ApiPropertyOptional({ description: '카테고리 (보조 필터)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: ['EASY', 'MEDIUM', 'HARD'],
    description: '난이도 (보조 필터)',
  })
  @IsOptional()
  @IsEnum(['EASY', 'MEDIUM', 'HARD'])
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiPropertyOptional({ enum: ['recruiting', 'active', 'completed'] })
  @IsOptional()
  @IsEnum(['recruiting', 'active', 'completed'])
  status?: 'recruiting' | 'active' | 'completed';

  @ApiPropertyOptional({ description: '호스트 사용자 ID' })
  @IsOptional()
  @IsString()
  hostUserId?: string;

  @ApiPropertyOptional({ description: '검색 키워드' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @ApiPropertyOptional({
    enum: ['scheduledAt', 'distance', 'seats', 'deadline'],
  })
  @IsOptional()
  @IsEnum(['scheduledAt', 'distance', 'seats', 'deadline'])
  sort?: 'scheduledAt' | 'distance' | 'seats' | 'deadline' = 'scheduledAt';
}

// 응답 DTO
export class MissionSearchResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  category: string[];

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty()
  duration: number;

  @ApiProperty()
  minParticipants: number;

  @ApiProperty()
  maxParticipants: number;

  @ApiProperty()
  point: number;

  @ApiProperty()
  thumbnailUrl: string;

  @ApiProperty()
  upcomingMeetingsCount: number;

  @ApiProperty()
  completedCount: number;

  @ApiProperty()
  averageRating: number;
}

export class MeetingSearchResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  missionId: string;

  @ApiProperty()
  missionSnapshot: {
    title: string;
    category: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    thumbnailUrl: string;
  };

  @ApiProperty()
  scheduledAt: string;

  @ApiProperty()
  recruitUntil: string;

  @ApiProperty({ enum: ['recruiting', 'active', 'completed'] })
  status: 'recruiting' | 'active' | 'completed';

  @ApiProperty()
  availableSeats: number;

  @ApiProperty()
  maxParticipants: number;

  @ApiProperty()
  location: {
    district: string;
    place: string;
    latitude: number;
    longitude: number;
  };

  @ApiPropertyOptional()
  distance?: number;

  @ApiProperty()
  host: {
    id: string;
    nickname: string;
    profileImageUrl: string;
    level: number;
  };

  @ApiProperty()
  focusScore: number;

  @ApiProperty({ type: [String] })
  preferredTraits: string[];
}

export class SearchMissionsResponseDto {
  @ApiProperty({ type: [MissionSearchResultDto] })
  missions: MissionSearchResultDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  totalPages: number;
}

export class SearchMeetingsResponseDto {
  @ApiProperty({ type: [MeetingSearchResultDto] })
  meetings: MeetingSearchResultDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  totalPages: number;
}
