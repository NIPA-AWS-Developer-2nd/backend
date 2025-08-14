import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { GetMeetingsQueryDto } from './dto/get-meetings-query.dto';
import { GetMeetingsResponseDto } from './dto/meeting-response.dto';
import { RequireLocationVerification } from '../../auth/decorators/location-verified.decorator';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';

@ApiTags('meetings')
@Controller('meetings')
@UseGuards(LocationVerifiedGuard)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: '모임 목록 조회',
    description: `
번개모임 목록을 조회합니다.
- 주간 네비게이션: weekStartDate, weekEndDate로 주간 범위 필터링
- 날짜 선택: selectedDate로 특정 날짜의 모임만 조회 (우선순위 높음)
- 페이지네이션: 기본 6개씩, 최대 20개까지 조회 가능
- 필터: 상태, 카테고리, 지역구, 난이도, 검색 키워드
- 정렬: latest(최신순), deadline(마감순), popular(인기순)
    `,
  })
  @ApiResponse({
    status: 403,
    description: '위치 인증이 필요함',
    example: {
      status: 403,
      message: '지역 인증이 필요합니다. 설정에서 위치 인증을 완료해주세요.',
      result: false,
    },
  })
  @ApiResponse({
    status: 200,
    description: '모임 목록 조회 성공',
    type: GetMeetingsResponseDto,
    example: {
      meetings: [
        {
          id: '01HQXXX001',
          missionId: 'mission1',
          hostUserId: 'user1',
          status: 'recruiting',
          recruitUntil: '2024-01-15T23:59:59.000Z',
          scheduledAt: '2024-01-16T10:00:00.000Z',
          createdAt: '2024-01-10T12:00:00.000Z',
          updatedAt: '2024-01-10T12:00:00.000Z',
          currentParticipants: 3,
          mission: {
            id: 'mission1',
            title: '한강 러닝 크루 함께해요',
            description: '한강에서 함께 러닝하실 분들 모집합니다',
            minParticipants: 2,
            maxParticipants: 8,
            difficulty: 'easy',
            thumbnailUrl: 'https://example.com/image.jpg',
            hashtags: ['러닝', '한강', '운동'],
            category: {
              id: 1,
              name: '운동',
              slug: 'sports',
              isActive: true,
            },
            district: {
              id: '11680',
              regionCode: '11680',
              districtName: '송파구',
              city: '서울',
              isActive: true,
            },
          },
          host: {
            id: 'user1',
            nickname: '러닝매니아',
            profileImageUrl: 'https://example.com/profile.jpg',
            points: 1200,
            level: 3,
          },
        },
      ],
      page: 1,
      size: 6,
      totalElements: 15,
      totalPages: 3,
      hasNext: true,
      hasPrevious: false,
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효하지 않은 파라미터)',
    example: {
      status: 400,
      message: '날짜 형식이 올바르지 않습니다.',
      result: false,
    },
  })
  async getMeetings(
    @Query() query: GetMeetingsQueryDto,
  ): Promise<GetMeetingsResponseDto> {
    return this.meetingService.getMeetings(query);
  }
}
