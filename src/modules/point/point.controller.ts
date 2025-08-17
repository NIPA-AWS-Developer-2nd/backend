import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PointService } from './point.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PointTransaction } from '../../entities';

@ApiTags('Points')
@Controller('points')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({
    summary: '포인트 내역 조회',
    description: '사용자의 포인트 거래 내역을 조회합니다.',
  })
  @ApiQuery({
    name: 'limit',
    description: '조회할 내역 수',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: '건너뛸 내역 수',
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: '포인트 내역 조회 성공',
    example: [
      {
        id: '01HQXXX001',
        type: 'meeting_payment',
        amount: -100,
        balanceBefore: 500,
        balanceAfter: 400,
        description: '모임 참여비 결제',
        createdAt: '2024-01-15T10:00:00.000Z',
        meeting: {
          id: '01HQXXX002',
          mission: {
            title: '한강 러닝',
            basePoints: 100,
          },
        },
      },
      {
        id: '01HQXXX003',
        type: 'meeting_reward',
        amount: 100,
        balanceBefore: 400,
        balanceAfter: 500,
        description: '모임 완료 보상',
        createdAt: '2024-01-16T18:00:00.000Z',
        meeting: {
          id: '01HQXXX002',
          mission: {
            title: '한강 러닝',
            basePoints: 100,
          },
        },
      },
    ],
  })
  async getPointHistory(
    @CurrentUser() user: { id: string },
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PointTransaction[]> {
    return this.pointService.getUserPointHistory(
      user.id,
      limit || 20,
      offset || 0,
    );
  }

  @ApiBearerAuth()
  @Get('balance')
  @ApiOperation({
    summary: '현재 포인트 조회',
    description: '사용자의 현재 포인트 잔액을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '포인트 조회 성공',
    example: {
      points: 1250,
    },
  })
  async getPointBalance(
    @CurrentUser() user: { id: string },
  ): Promise<{ points: number }> {
    console.log('Point balance request for user:', user.id);
    const points = await this.pointService.getUserPoints(user.id);
    const result = { points };
    console.log('Point balance result:', result);
    return result;
  }
}
