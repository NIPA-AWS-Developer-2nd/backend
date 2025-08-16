import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingHostDto {
  @ApiProperty({ description: '호스트 사용자 ID' })
  id: string;

  @ApiProperty({ description: '호스트 닉네임' })
  nickname: string;

  @ApiPropertyOptional({ description: '호스트 프로필 이미지 URL' })
  profileImageUrl: string | null;

  @ApiProperty({ description: '호스트 포인트' })
  points: number;

  @ApiProperty({ description: '호스트 레벨' })
  level: number;

  @ApiPropertyOptional({ description: '호스트 MBTI' })
  mbti?: string;
}

export class ParticipantProfileDto {
  @ApiProperty({ description: '참여자 사용자 ID' })
  id: string;

  @ApiProperty({ description: '참여자 닉네임' })
  nickname: string;

  @ApiPropertyOptional({ description: '참여자 프로필 이미지 URL' })
  profileImageUrl: string | null;

  @ApiProperty({ description: '참여자 레벨' })
  level: number;

  @ApiProperty({ description: '호스트 여부' })
  isHost: boolean;
}

export class MeetingMissionDto {
  @ApiProperty({ description: '미션 ID' })
  id: string;

  @ApiProperty({ description: '미션 제목' })
  title: string;

  @ApiProperty({ description: '미션 설명' })
  description: string;

  @ApiProperty({ description: '참여 인원' })
  participants: number;

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
    enum: ['very_easy', 'easy', 'medium', 'hard', 'very_hard'],
    description: '미션 난이도',
  })
  difficulty: string;

  @ApiProperty({ description: '썸네일 이미지 URL' })
  thumbnailUrl: string;

  @ApiProperty({ type: [String], description: '주의사항 목록' })
  precautions: string[];

  @ApiProperty({ description: '지역구 ID' })
  districtId: string;

  @ApiPropertyOptional({ description: '활동 장소명' })
  location?: string | null;

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

export class MeetingParticipantDto {
  @ApiProperty({ description: '참여자 사용자 ID' })
  userId: string;

  @ApiProperty({ description: '참여자 닉네임' })
  nickname: string;

  @ApiPropertyOptional({ description: '참여자 프로필 이미지 URL' })
  profileImageUrl: string | null;

  @ApiProperty({ description: '참여자 포인트' })
  points: number;

  @ApiProperty({ description: '참여자 레벨' })
  level: number;

  @ApiProperty({
    enum: ['joined', 'completed', 'dropped'],
    description: '참여 상태',
  })
  status: string;

  @ApiProperty({ description: '호스트 여부' })
  isHost: boolean;

  @ApiPropertyOptional({ description: '참여자 MBTI' })
  mbti?: string;

  @ApiPropertyOptional({ description: '참여자 소개글' })
  bio?: string;

  @ApiProperty({ description: '참여 신청일시 (ISO 8601)' })
  joinedAt: string;

  @ApiProperty({ description: '생성일시 (ISO 8601)' })
  createdAt: string;
}

export class MeetingDto {
  @ApiProperty({ description: '모임 ID' })
  id: string;

  @ApiProperty({ description: '미션 ID' })
  missionId: string;

  @ApiProperty({ description: '호스트 사용자 ID' })
  hostUserId: string;

  @ApiProperty({
    enum: ['recruiting', 'ready', 'active', 'completed', 'canceled'],
    description: '모임 상태',
  })
  status: string;

  @ApiPropertyOptional({ description: '모집 마감 일시 (ISO 8601)' })
  recruitUntil: string | null;

  @ApiPropertyOptional({ description: '모임 예정 일시 (ISO 8601)' })
  scheduledAt: string | null;

  @ApiPropertyOptional({ description: 'QR 코드 토큰' })
  qrCodeToken?: string | null;

  @ApiPropertyOptional({ description: 'QR 코드 생성 일시 (ISO 8601)' })
  qrGeneratedAt?: string | null;

  @ApiProperty({ description: '생성일시 (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ description: '수정일시 (ISO 8601)' })
  updatedAt: string;

  @ApiProperty({ description: '현재 참여자 수' })
  currentParticipants: number;

  @ApiProperty({ description: '최대 참여 인원' })
  maxParticipants: number;

  @ApiProperty({ description: '좋아요 수', default: 0 })
  likesCount: number;

  @ApiPropertyOptional({ description: '현재 사용자가 좋아요를 눌렀는지 여부' })
  isLiked?: boolean;

  @ApiProperty({ description: '현재 사용자가 참여 중인지 여부' })
  meJoined: boolean;

  @ApiProperty({ description: '현재 사용자가 호스트인지 여부' })
  isHost: boolean;

  // Relations
  @ApiPropertyOptional({ type: MeetingMissionDto, description: '미션 정보' })
  mission?: MeetingMissionDto;

  @ApiPropertyOptional({ type: MeetingHostDto, description: '호스트 정보' })
  host?: MeetingHostDto;

  @ApiPropertyOptional({
    type: [ParticipantProfileDto],
    description: '참여자 프로필 목록 (리스트용)',
  })
  participantProfiles?: ParticipantProfileDto[];

  @ApiProperty({
    type: [MeetingParticipantDto],
    description: '참여자 목록 (각 참여자의 userId, isHost 포함)',
  })
  participants: MeetingParticipantDto[];
}

export class MeetingDetailDto extends MeetingDto {

  @ApiProperty({ type: [MeetingParticipantDto], description: '참여자 목록' })
  participantList: MeetingParticipantDto[];

  @ApiProperty({ description: '참여 가능 여부 (현재 사용자 기준)' })
  canJoin: boolean;

  @ApiProperty({ description: '현재 사용자의 참여 상태' })
  userParticipationStatus: string | null;

  @ApiProperty({ description: '현재 사용자가 좋아요를 눌렀는지 여부' })
  declare isLiked: boolean;
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
