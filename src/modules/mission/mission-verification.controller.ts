import { Controller, Post, Get, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MissionVerificationService } from './mission-verification.service';
import { VerifyMissionDto, SubmitMissionDto } from './dto/mission-verification.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Mission Verification')
@Controller('mission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MissionVerificationController {
  constructor(
    private readonly missionVerificationService: MissionVerificationService,
  ) {}

  @Post('verify')
  @ApiOperation({
    summary: '미션 사진 AI 인증',
    description: '업로드된 미션 사진을 AI로 검증합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '미션 인증 요청 성공',
    example: {
      status: 200,
      message: '미션 인증이 요청되었습니다.',
      result: true,
      data: {
        status: 'approved', // 'approved' | 'rejected' | 'pending'
        verifiedAt: '2024-01-01T10:00:00Z',
      }
    }
  })
  async verifyMission(
    @Body() verifyMissionDto: VerifyMissionDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.missionVerificationService.verifyMission(
      userId,
      verifyMissionDto,
    );
    
    return ApiResponseDto.success(result, '미션 인증이 요청되었습니다.');
  }

  @Get('verify/status')
  @ApiOperation({
    summary: '미션 인증 상태 확인',
    description: '미션 인증 처리 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증 상태 조회 성공',
    example: {
      status: 200,
      message: '인증 상태를 조회했습니다.',
      result: true,
      data: {
        status: 'approved',
        verifiedAt: '2024-01-01T10:00:00Z',
      }
    }
  })
  async getVerificationStatus(
    @Query('meetingId') meetingId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.missionVerificationService.getVerificationStatus(
      userId,
      meetingId,
    );
    
    return ApiResponseDto.success(result, '인증 상태를 조회했습니다.');
  }

  @Post('submit')
  @ApiOperation({
    summary: '미션 리뷰 최종 제출',
    description: '인증된 미션에 대한 별점과 후기를 제출합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '미션 리뷰 제출 성공',
    example: {
      status: 200,
      message: '미션 리뷰가 제출되었습니다.',
      result: true,
      data: {
        reviewId: 'review-id',
        submittedAt: '2024-01-01T10:00:00Z',
      }
    }
  })
  async submitMission(
    @Body() submitMissionDto: SubmitMissionDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.missionVerificationService.submitMission(
      userId,
      submitMissionDto,
    );
    
    return ApiResponseDto.success(result, '미션 리뷰가 제출되었습니다.');
  }
}