import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { MeetingService } from './meeting.service';
import { GetMeetingsQueryDto } from './dto/get-meetings-query.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import {
  GetMeetingsResponseDto,
  MeetingDetailDto,
} from './dto/meeting-response.dto';
import { RequireLocationVerification } from '../../auth/decorators/location-verified.decorator';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Meetings')
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
    @CurrentUser() user?: { id: string },
  ): Promise<GetMeetingsResponseDto> {
    return this.meetingService.getMeetings(query, user?.id);
  }

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: '모임 생성',
    description: `
새로운 모임을 생성합니다.
- 호스트는 자동으로 참여자로 등록됩니다.
- 모집 마감일은 현재 시간 이후여야 합니다.
- 미션 수행일은 모집 마감일 이후여야 합니다.
- 최대 참여자 수가 지정되지 않으면 미션의 최대 참여자 수를 사용합니다.
    `,
  })
  @ApiBody({
    type: CreateMeetingDto,
    description: '모임 생성 정보',
    examples: {
      basic: {
        summary: '기본 모임 생성',
        value: {
          missionId: '01HQXXX1234567890123456789',
          recruitUntil: '2024-12-15T23:59:59.000Z',
          scheduledAt: '2024-12-16T14:00:00.000Z',
          maxParticipants: 4,
        },
      },
      detailed: {
        summary: '상세 정보가 포함된 모임 생성',
        value: {
          missionId: '01HQXXX1234567890123456789',
          recruitUntil: '2024-12-15T23:59:59.000Z',
          scheduledAt: '2024-12-16T14:00:00.000Z',
          maxParticipants: 6,
          introduction: '함께 재미있게 미션을 수행해요! 초보자도 환영합니다.',
          focusScore: 70,
          hostStake: 100,
          participantStake: 50,
          traits: [{ id: 'trait_001' }, { id: 'trait_002' }],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '모임 생성 성공',
    type: MeetingDetailDto,
    example: {
      id: '01HQXXX002',
      missionId: '01HQXXX1234567890123456789',
      hostUserId: 'user1',
      status: 'recruiting',
      recruitUntil: '2024-12-15T23:59:59.000Z',
      scheduledAt: '2024-12-16T14:00:00.000Z',
      maxParticipants: 4,
      createdAt: '2024-12-10T12:00:00.000Z',
      updatedAt: '2024-12-10T12:00:00.000Z',
      currentParticipants: 1,
      canJoin: false,
      userParticipationStatus: 'joined',
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효성 검사 실패)',
    example: {
      status: 400,
      message: '모집 마감일은 현재 시간 이후여야 합니다.',
      result: false,
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 미션',
    example: {
      status: 404,
      message: '존재하지 않는 미션입니다.',
      result: false,
    },
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
  async createMeeting(
    @CurrentUser() user: { id: string },
    @Body() createMeetingDto: CreateMeetingDto,
  ): Promise<MeetingDetailDto> {
    return this.meetingService.createMeeting(user.id, createMeetingDto);
  }

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Get(':id')
  @ApiParam({
    name: 'id',
    description: '모임 ID (ULID)',
    example: '01HQXXX001',
  })
  @ApiOperation({
    summary: '모임 상세 조회',
    description: `
특정 모임의 상세 정보를 조회합니다.
- 모임 기본 정보 (미션, 호스트, 일정 등)
- 참여자 목록 및 참여 상태
- 현재 사용자의 참여 가능 여부
- 현재 사용자의 참여 상태
    `,
  })
  @ApiResponse({
    status: 200,
    description: '모임 상세 조회 성공',
    type: MeetingDetailDto,
    example: {
      id: '01HQXXX001',
      missionId: 'mission1',
      hostUserId: 'user1',
      status: 'recruiting',
      recruitUntil: '2024-01-15T23:59:59.000Z',
      scheduledAt: '2024-01-16T10:00:00.000Z',
      maxParticipants: 8,
      qrCodeToken: null,
      qrGeneratedAt: null,
      createdAt: '2024-01-10T12:00:00.000Z',
      updatedAt: '2024-01-10T12:00:00.000Z',
      currentParticipants: 3,
      canJoin: true,
      userParticipationStatus: null,
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
      participants: [
        {
          userId: 'user1',
          nickname: '러닝매니아',
          profileImageUrl: 'https://example.com/profile.jpg',
          points: 1200,
          level: 3,
          status: 'joined',
          createdAt: '2024-01-10T12:00:00.000Z',
        },
        {
          userId: 'user2',
          nickname: '달리기좋아',
          profileImageUrl: 'https://example.com/profile2.jpg',
          points: 800,
          level: 2,
          status: 'joined',
          createdAt: '2024-01-11T14:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 모임',
    example: {
      status: 404,
      message: '모임을 찾을 수 없습니다.',
      result: false,
    },
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
  async getMeetingDetail(
    @Param('id') meetingId: string,
    @CurrentUser() user?: { id: string },
  ): Promise<MeetingDetailDto> {
    return this.meetingService.getMeetingDetail(meetingId, user?.id);
  }

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Delete(':id')
  @ApiParam({
    name: 'id',
    description: '모임 ID (ULID)',
    example: '01HQXXX001',
  })
  @ApiOperation({
    summary: '모임 삭제',
    description: `
모임을 삭제합니다. (호스트만 가능)
- 호스트만 모임을 삭제할 수 있습니다
- 모집 중인 모임만 삭제 가능합니다
- 참여자가 있는 경우 삭제할 수 없습니다
    `,
  })
  @ApiResponse({
    status: 200,
    description: '모임 삭제 성공',
    example: {
      status: 200,
      message: '모임이 삭제되었습니다.',
      result: true,
    },
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음 (호스트가 아님)',
    example: {
      status: 403,
      message: '모임을 삭제할 권한이 없습니다.',
      result: false,
    },
  })
  @ApiResponse({
    status: 404,
    description: '존재하지 않는 모임',
    example: {
      status: 404,
      message: '모임을 찾을 수 없습니다.',
      result: false,
    },
  })
  @ApiResponse({
    status: 400,
    description: '삭제 불가능한 상태',
    example: {
      status: 400,
      message: '참여자가 있는 모임은 삭제할 수 없습니다.',
      result: false,
    },
  })
  async deleteMeeting(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ message: string }> {
    await this.meetingService.deleteMeeting(meetingId, user.id);
    return { message: '모임이 삭제되었습니다.' };
  }

  @Post(':id/like')
  @RequireLocationVerification()
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '모임 ID',
    example: '01HQXXX123',
  })
  @ApiOperation({
    summary: '모임 좋아요',
    description: '모임에 좋아요를 추가합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '좋아요 성공',
    example: {
      likesCount: 5,
      isLiked: true,
    },
  })
  @ApiResponse({
    status: 404,
    description: '모임을 찾을 수 없음',
    example: {
      status: 404,
      message: '모임을 찾을 수 없습니다.',
      result: false,
    },
  })
  async toggleLike(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ likesCount: number; isLiked: boolean }> {
    return this.meetingService.toggleLike(meetingId, user.id);
  }

  @Post(':id/join')
  @RequireLocationVerification()
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '모임 ID',
    example: '01HQXXX123',
  })
  @ApiOperation({
    summary: '모임 참여',
    description: '모임에 참여합니다. 포인트 결제가 자동으로 처리됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모임 참여 성공',
    example: {
      success: true,
      message: '모임에 참여했습니다. 100P가 차감되었습니다.',
    },
  })
  @ApiResponse({
    status: 400,
    description: '참여 불가능 (포인트 부족, 인원 초과 등)',
    example: {
      status: 400,
      message: '포인트가 부족합니다. 현재 50P, 필요 100P',
      result: false,
    },
  })
  async joinMeeting(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.meetingService.joinMeeting(meetingId, user.id);
  }

  @Post(':id/leave')
  @RequireLocationVerification()
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '모임 ID',
    example: '01HQXXX123',
  })
  @ApiOperation({
    summary: '모임 탈퇴',
    description: '모임에서 탈퇴합니다. 취소 정책에 따라 환불이 처리됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모임 탈퇴 성공',
    example: {
      success: true,
      message: '모임을 탈퇴했습니다. 50P가 환불되었습니다.',
    },
  })
  async leaveMeeting(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.meetingService.leaveMeeting(meetingId, user.id);
  }

  @Patch(':id')
  @RequireLocationVerification()
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '모임 ID',
    example: '01HQXXX123',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        introduction: {
          type: 'string',
          description: '모임 소개글',
          example: '함께 런닝하실 분들을 모집합니다!',
        },
        focusScore: {
          type: 'number',
          description: '집중도 점수 (0-100)',
          example: 80,
        },
      },
    },
  })
  @ApiOperation({
    summary: '모임 수정 (호스트)',
    description:
      '호스트가 모임을 수정합니다. RECRUITING 상태에서만 소개글과 집중도 점수 수정 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모임 수정 성공',
    example: {
      success: true,
      message: '모임이 수정되었습니다.',
    },
  })
  async updateMeeting(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
    @Body() updateData: { introduction?: string; focusScore?: number },
  ): Promise<{ success: boolean; message: string }> {
    return this.meetingService.updateMeeting(meetingId, user.id, updateData);
  }

  @Post(':id/cancel')
  @RequireLocationVerification()
  @ApiBearerAuth()
  @ApiParam({
    name: 'id',
    description: '모임 ID',
    example: '01HQXXX123',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: '취소 사유',
          example: '개인 사정으로 인한 취소',
        },
      },
      required: ['reason'],
    },
  })
  @ApiOperation({
    summary: '모임 취소 (호스트)',
    description:
      '호스트가 모임을 취소합니다. 취소 정책에 따라 환불/패널티가 처리됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모임 취소 성공',
    example: {
      success: true,
      message: '모임이 취소되었습니다. 참여자들에게 총 300P가 환불되었습니다.',
    },
  })
  async cancelMeeting(
    @Param('id') meetingId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { reason: string },
  ): Promise<{ success: boolean; message: string }> {
    return this.meetingService.cancelMeetingByHost(
      meetingId,
      user.id,
      body.reason,
    );
  }
}
