import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Request,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MissionVerificationService } from './mission-verification.service';
import {
  VerifyMissionDto,
  SubmitMissionDto,
  UploadVerificationPhotoDto,
} from './dto/mission-verification.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Mission Verification')
@Controller('mission')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MissionVerificationController {
  constructor(
    private readonly missionVerificationService: MissionVerificationService,
  ) {}

  @Post('verify/photo')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '미션 사진 업로드 및 AI 인증',
    description: '미션 사진을 업로드하고 Bedrock Claude로 즉시 검증합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '미션 사진 인증 성공',
    example: {
      status: 200,
      message: '미션 사진이 인증되었습니다.',
      result: true,
      data: {
        reviewId: 123,
        status: 'approved',
        confidence: 95,
        reasoning: '사진에 사람이 명확히 보이고 미션 요구사항을 충족합니다.',
        detectedElements: ['사람', '음식', '식당'],
        verifiedAt: '2024-01-01T10:00:00Z',
      },
    },
  })
  async uploadAndVerifyPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    photo: Express.Multer.File,
    @Body() uploadDto: UploadVerificationPhotoDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const result =
      await this.missionVerificationService.uploadAndVerifyMissionPhoto(
        userId,
        uploadDto,
        photo,
      );

    return ApiResponseDto.success(result, '미션 사진이 인증되었습니다.');
  }

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
      },
    },
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
        photoUrls: ['https://example.com/photo1.jpg'],
        photoUrl: 'https://example.com/photo1.jpg',
        rating: 5,
        reviewText: '정말 좋은 경험이었습니다!',
        confidence: 95,
        reasoning: '사진에 사람이 명확히 보이고 미션 요구사항을 충족합니다.',
        detectedElements: ['사람', '음식', '식당'],
      },
    },
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
      },
    },
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
