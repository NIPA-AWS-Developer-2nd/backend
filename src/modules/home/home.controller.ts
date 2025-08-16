import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HomeService } from './home.service';
import { GetHomeDataDto } from './dto/get-home-data.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Home(main)')
@Controller('home')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HomeController {
  private readonly logger = new Logger(HomeController.name);

  constructor(private readonly homeService: HomeService) {}

  @Get('data')
  @ApiOperation({
    summary: '홈 페이지 데이터 조회',
    description: '홈 페이지에 표시될 데이터를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '홈 페이지 데이터 조회 성공',
    example: {
      status: 200,
      message: '홈 데이터를 성공적으로 조회했습니다.',
      result: true,
      data: {
        availableMissions: [
          {
            id: '01HQXXX...',
            title: '한강 러닝',
            description: '한강에서 함께 러닝해요',
            basePoints: 100,
            difficulty: 'easy',
            thumbnailUrl: 'https://example.com/image.jpg',
          },
        ],
        hotMeetings: [
          {
            id: '01HQYYY...',
            title: '한강 러닝 모임',
            scheduledAt: '2024-01-15T10:00:00Z',
            location: '한강공원 반포지구',
            maxParticipants: 8,
            currentParticipants: 4,
            likesCount: 12,
            hostName: '러닝러버',
            mission: {
              title: '한강 러닝',
              difficulty: 'easy',
              basePoints: 100,
            },
          },
        ],
        myMeetings: [
          {
            id: '01HQZZZ...',
            title: '독서 모임',
            status: 'hosting',
            scheduledAt: '2024-01-14T19:00:00Z',
            isHost: true,
            participantCount: 6,
            mission: {
              title: '독서 토론',
              basePoints: 80,
            },
          },
        ],
        activityLogs: [
          {
            id: '01HQAAA...',
            userId: '01HQUSER...',
            type: 'meeting_joined',
            meetingId: '01HQMEETING...',
            createdAt: '2024-01-13T15:30:00Z',
            meeting: {
              id: '01HQMEETING...',
              title: '등산 모임',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    example: {
      status: 401,
      message: '인증이 필요합니다.',
      result: false,
    },
  })
  async getHomeData(
    @Query() query: GetHomeDataDto,
    @Request() req: { user: { id: string } },
  ) {
    this.logger.log(`🏠 HOME API CALLED: Getting home data for user ${req.user.id} with limit ${query.limit}`);

    const data = await this.homeService.getHomeData(req.user.id, query.limit);

    return {
      status: 200,
      message: '홈 데이터를 성공적으로 조회했습니다.',
      result: true,
      data,
    };
  }

  @Get('meetings/:id/detail')
  @ApiOperation({
    summary: '내 모임 상세 정보 조회',
    description: '참여 중인 모임의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '모임 상세 정보 조회 성공',
    example: {
      status: 200,
      message: '모임 상세 정보를 성공적으로 조회했습니다.',
      result: true,
      data: {
        id: '01HQXXX...',
        title: '한강 러닝 모임',
        description: '한강에서 함께 건강하게 러닝해요',
        scheduledAt: '2024-01-15T10:00:00Z',
        status: 'recruiting',
        maxParticipants: 8,
        currentParticipants: 4,
        mission: {
          title: '한강 러닝',
          location: '한강공원 반포지구',
          precautions: ['운동화 착용', '물 준비'],
        },
        region: {
          districtName: '서초구',
          city: '서울시',
        },
        host: {
          nickname: '러닝러버',
          level: 5,
          mbti: 'ENFP',
        },
        participants: [
          {
            id: '01HQUSER1...',
            nickname: '러닝러버',
            level: 5,
            mbti: 'ENFP',
            isHost: true,
          },
        ],
        chatRoomId: '01HQCHAT...',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '모임을 찾을 수 없음',
    example: {
      status: 404,
      message: '해당 모임에 참여하지 않았습니다.',
      result: false,
    },
  })
  async getMyMeetingDetail(
    @Param('id') meetingId: string,
    @Request() req: { user: { id: string } },
  ) {
    this.logger.log(
      `Getting meeting detail ${meetingId} for user ${req.user.id}`,
    );

    const data = await this.homeService.getMyMeetingDetail(
      req.user.id,
      meetingId,
    );

    return {
      status: 200,
      message: '모임 상세 정보를 성공적으로 조회했습니다.',
      result: true,
      data,
    };
  }
}
