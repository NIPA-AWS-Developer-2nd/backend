import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingHostDto {
  @ApiProperty({ description: '호스트 사용자 ID' })
  id: string;

  @ApiProperty({ description: '호스트 닉네임' })
  nickname: string;

  @ApiProperty({ description: '호스트 프로필 이미지 URL' })
  profileImageUrl: string;

  @ApiProperty({ description: '호스트 포인트' })
  points: number;

  @ApiProperty({ description: '호스트 레벨' })
  level: number;
}

export class MeetingMissionDto {
  @ApiProperty({ description: '미션 ID' })
  id: string;

  @ApiProperty({ description: '미션 제목' })
  title: string;

  @ApiProperty({ description: '미션 설명' })
  description: string;

  @ApiProperty({ description: '최소 참여 인원' })
  minParticipants: number;

  @ApiProperty({ description: '최대 참여 인원' })
  maxParticipants: number;

  @ApiProperty({ description: '예상 소요 시간(분)' })
  estimatedDuration: number;

  @ApiProperty({ description: '최소 소요 시간(분)' })
  minimumDuration: number;

  @ApiProperty({ description: '기본 포인트' })
  basePoints: number;

  @ApiProperty({ description: '사진 인증 가이드' })
  photoVerificationGuide: string;

  @ApiProperty({ type: [String], description: '샘플 이미지 URLs' })
  sampleImageUrls: string[];

  @ApiProperty({ description: '카테고리 ID' })
  categoryId: number;

  @ApiProperty({
    enum: ['easy', 'medium', 'hard'],
    description: '미션 난이도',
  })
  difficulty: string;

  @ApiProperty({ description: '썸네일 이미지 URL' })
  thumbnailUrl: string;

  @ApiProperty({ type: [String], description: '주의사항 목록' })
  precautions: string[];

  @ApiProperty({ description: '지역구 ID' })
  districtId: string;

  @ApiPropertyOptional({ description: '장소명' })
  location?: string;

  @ApiProperty({ type: [String], description: '해시태그 목록' })
  hashtags: string[];

  @ApiProperty({ description: '활성 상태' })
  isActive: boolean;

  @ApiProperty({ description: '생성일시' })
  createdAt: string;

  @ApiProperty({ description: '수정일시' })
  updatedAt: string;

  // Relations
  @ApiPropertyOptional({ description: '카테고리 정보' })
  category?: {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
  };

  @ApiPropertyOptional({ description: '지역구 정보' })
  district?: {
    id: string;
    regionCode: string;
    districtName: string;
    city: string;
    isActive: boolean;
  };
}

export class MeetingDto {
  @ApiProperty({ description: '모임 ID' })
  id: string;

  @ApiProperty({ description: '미션 ID' })
  missionId: string;

  @ApiProperty({ description: '호스트 사용자 ID' })
  hostUserId: string;

  @ApiProperty({
    enum: ['recruiting', 'active', 'completed', 'cancelled'],
    description: '모임 상태',
  })
  status: string;

  @ApiProperty({ description: '모집 마감 일시 (ISO 8601)' })
  recruitUntil: string;

  @ApiProperty({ description: '모임 예정 일시 (ISO 8601)' })
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'QR 코드 토큰' })
  qrCodeToken?: string;

  @ApiPropertyOptional({ description: 'QR 코드 생성 일시 (ISO 8601)' })
  qrGeneratedAt?: string;

  @ApiProperty({ description: '생성일시 (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ description: '수정일시 (ISO 8601)' })
  updatedAt: string;

  @ApiPropertyOptional({ description: '현재 참여자 수' })
  currentParticipants?: number;

  // Relations
  @ApiPropertyOptional({ type: MeetingMissionDto, description: '미션 정보' })
  mission?: MeetingMissionDto;

  @ApiPropertyOptional({ type: MeetingHostDto, description: '호스트 정보' })
  host?: MeetingHostDto;
}

export class GetMeetingsResponseDto {
  @ApiProperty({ type: [MeetingDto], description: '모임 목록' })
  meetings: MeetingDto[];

  @ApiProperty({ description: '현재 페이지 번호' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  size: number;

  @ApiProperty({ description: '전체 모임 수' })
  totalElements: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  hasNext: boolean;

  @ApiProperty({ description: '이전 페이지 존재 여부' })
  hasPrevious: boolean;
}
