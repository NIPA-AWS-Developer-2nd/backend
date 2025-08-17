import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerifyLocationDto } from './dto/verify-location.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import {
  ResourceNotFoundException,
  ValidationException,
} from '../../common/exceptions';
import { ErrorCode } from '../../common/types/common.types';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 온보딩 완료
  @ApiOperation({
    summary: '사용자 온보딩 완료',
    description: '사용자의 온보딩 과정을 완료하고 프로필 정보를 저장합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '온보딩 완료 성공',
    example: {
      status: 201,
      message: '온보딩이 완료되었습니다.',
      result: true,
      data: {
        user: { id: '01HQXXX...', phoneNumber: '01012345678' },
        profile: { nickname: '사용자', districtId: 'seoul-gangnam' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    example: {
      status: 400,
      message: '유효하지 않은 지역 ID입니다.',
      result: false,
      data: { errorCode: 'VALIDATION_003' },
    },
  })
  @Post('onboarding')
  async completeOnboarding(
    @Body() onboardingData: OnboardingCompleteDto,
    @CurrentUser() user: User,
  ) {
    try {
      const result = await this.userService.completeOnboarding(
        user.id,
        onboardingData,
      );
      return ApiResponseDto.created(result, '온보딩이 완료되었습니다.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ValidationException(
          error.message,
          undefined,
          ErrorCode.VALIDATION_FAILED,
        );
      }
      throw error;
    }
  }

  // 내 사용자 정보 조회
  @ApiOperation({
    summary: '내 사용자 정보 조회',
    description: '현재 로그인한 사용자의 기본 정보와 프로필을 모두 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    example: {
      status: 200,
      message: '사용자 정보 조회가 완료되었습니다.',
      result: true,
      data: {
        id: '01HQXXX...',
        phoneNumber: '01012345678',
        status: 'ACTIVE',
        onboardingCompletedAt: '2024-01-15T01:00:00Z',
        profile: {
          nickname: '사용자',
          profileImageUrl: 'https://example.com/image.jpg',
          interests: ['문화', '스포츠'],
        },
      },
    },
  })
  @Get('me')
  async getMe(@CurrentUser() user: User) {
    try {
      const result = await this.userService.getCompleteUserInfo(user.id);

      if (!result) {
        throw new ResourceNotFoundException(
          '사용자',
          user.id,
          ErrorCode.USER_NOT_FOUND,
        );
      }

      return ApiResponseDto.success(
        result,
        '사용자 정보 조회가 완료되었습니다.',
      );
    } catch (error: unknown) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw new ValidationException('사용자 정보 조회 중 오류가 발생했습니다.');
    }
  }

  // 내 프로필 업데이트
  @ApiOperation({
    summary: '내 프로필 업데이트',
    description: '현재 로그인한 사용자의 프로필 정보를 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 업데이트 성공',
    example: {
      status: 200,
      message: '프로필이 업데이트되었습니다.',
      result: true,
      data: {
        id: '01HQXXX...',
        profile: {
          nickname: '업데이트된 닉네임',
          bio: '업데이트된 소개',
          profileImageUrl: 'https://example.com/new-image.jpg',
          interests: ['문화', '스포츠'],
          mbti: 'ENFP',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 데이터',
    example: {
      status: 400,
      message: '유효하지 않은 카테고리 ID입니다.',
      result: false,
    },
  })
  @Put('profile')
  async updateMyProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: User,
  ) {
    try {
      const result = await this.userService.updateUserProfile(
        user.id,
        updateProfileDto,
      );
      return ApiResponseDto.success(result, '프로필이 업데이트되었습니다.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new ValidationException(
          error.message,
          undefined,
          ErrorCode.VALIDATION_FAILED,
        );
      }
      throw error;
    }
  }

  // 내 프로필 조회 (기존 유지)
  @ApiOperation({
    summary: '내 프로필 조회',
    description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    example: {
      status: 200,
      message: '프로필 조회가 완료되었습니다.',
      result: true,
      data: { user: { id: '01HQXXX...' }, profile: { nickname: '사용자' } },
    },
  })
  @Get('profile')
  async getMyProfile(@CurrentUser() user: User) {
    try {
      const result = await this.userService.getUserProfile(user.id);

      if (!result) {
        throw new ResourceNotFoundException(
          '사용자 프로필',
          user.id,
          ErrorCode.USER_NOT_FOUND,
        );
      }

      return ApiResponseDto.success(result, '프로필 조회가 완료되었습니다.');
    } catch (error: unknown) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw new ValidationException('프로필 조회 중 오류가 발생했습니다.');
    }
  }

  // 활동 통계 조회
  @ApiOperation({
    summary: '활동 통계 조회',
    description: '사용자의 활동 통계 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '활동 통계 조회 성공',
    example: {
      status: 200,
      message: '활동 통계 조회가 완료되었습니다.',
      result: true,
      data: {
        verificationCount: 45,
        reviewCount: 24,
        hostedMeetingCount: 18,
        completedMissionCount: 12,
      },
    },
  })
  @Get('activity-stats')
  async getActivityStats(@CurrentUser() user: User) {
    try {
      const result = await this.userService.getActivityStats(user.id);
      return ApiResponseDto.success(result, '활동 통계 조회가 완료되었습니다.');
    } catch {
      throw new ValidationException('활동 통계 조회 중 오류가 발생했습니다.');
    }
  }

  // 위치 인증 상태 확인
  @ApiOperation({
    summary: '위치 인증 상태 확인',
    description: '사용자의 위치 인증 상태를 확인합니다. (일주일 만료)',
  })
  @ApiResponse({
    status: 200,
    description: '위치 인증 상태 확인 성공',
    example: {
      status: 200,
      message: '위치 인증 상태 확인이 완료되었습니다.',
      result: true,
      data: {
        isVerified: true,
        lastVerificationAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @Get('location-verification-status')
  async checkLocationVerificationStatus(@CurrentUser() user: User) {
    try {
      const isVerified = await this.userService.checkLocationVerificationStatus(
        user.id,
      );

      // 사용자 정보에서 마지막 인증 시간 가져오기
      const userData = await this.userService.getCompleteUserInfo(user.id);

      return ApiResponseDto.success(
        {
          isVerified,
          lastVerificationAt: userData.lastLocationVerificationAt,
          currentDistrict: userData.currentDistrict,
        },
        '위치 인증 상태 확인이 완료되었습니다.',
      );
    } catch {
      throw new ValidationException(
        '위치 인증 상태 확인 중 오류가 발생했습니다.',
      );
    }
  }

  // 위치 인증
  @ApiOperation({
    summary: '위치 인증',
    description: '사용자의 현재 위치를 특정 지역과 인증합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '위치 인증 성공',
    example: {
      status: 200,
      message: '위치 인증이 완료되었습니다.',
      result: true,
      data: {
        isVerified: true,
        district: {
          id: '01HQXXX...',
          districtName: '강남구',
          city: '서울특별시',
        },
        distance: 1500,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '위치 인증 실패',
    example: {
      status: 400,
      message: '위치 인증에 실패했습니다.',
      result: false,
      data: {
        isVerified: false,
        message: '현재 위치가 강남구에서 2.5km 떨어져 있습니다.',
        distance: 2500,
      },
    },
  })
  @Post('verify-location')
  async verifyLocation(
    @CurrentUser() user: User,
    @Body() verifyLocationDto: VerifyLocationDto,
  ) {
    try {
      const result = await this.userService.verifyLocation(
        user.id,
        verifyLocationDto,
      );

      if (result.isVerified) {
        return ApiResponseDto.success(result, '위치 인증이 완료되었습니다.');
      } else {
        return ApiResponseDto.fail(
          400,
          result.message || '위치 인증에 실패했습니다.',
        );
      }
    } catch (error: unknown) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ValidationException
      ) {
        throw error;
      }
      throw new ValidationException('위치 인증 중 오류가 발생했습니다.');
    }
  }

  // 활성 지역 목록 조회
  @ApiOperation({
    summary: '활성 지역 목록 조회',
    description: '현재 활성화된 지역 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '지역 목록 조회 성공',
    example: {
      status: 200,
      message: '지역 목록 조회가 완료되었습니다.',
      result: true,
      data: [
        {
          id: '01HQXXX...',
          regionCode: '11680',
          districtName: '강남구',
          city: '서울특별시',
          isActive: true,
        },
      ],
    },
  })
  @Get('districts')
  async getActiveDistricts() {
    try {
      const result = await this.userService.getActiveDistricts();
      return ApiResponseDto.success(result, '지역 목록 조회가 완료되었습니다.');
    } catch {
      throw new ValidationException('지역 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 테스트용: 모든 사용자 목록 조회 (개발 환경에서만)
  @Get('list')
  async getAllUsers() {
    if (process.env.NODE_ENV !== 'development') {
      throw new ValidationException('개발 환경에서만 사용 가능합니다.');
    }

    try {
      const result = await this.userService.getAllUsers();
      return ApiResponseDto.success(
        result,
        '사용자 목록 조회가 완료되었습니다.',
      );
    } catch {
      throw new ValidationException('사용자 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 다른 사용자 프로필 조회
  @ApiOperation({
    summary: '다른 사용자 프로필 조회',
    description: '특정 사용자의 공개 프로필 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 프로필 조회 성공',
    example: {
      status: 200,
      message: '사용자 프로필 조회가 완료되었습니다.',
      result: true,
      data: {
        id: '01HQXXX...',
        profile: {
          nickname: '사용자',
          bio: '안녕하세요!',
          profileImageUrl: 'https://example.com/image.jpg',
          interests: ['문화', '스포츠'],
          mbti: 'ENFP',
        },
        stats: {
          verificationCount: 45,
          reviewCount: 24,
          hostedMeetingCount: 18,
          completedMissionCount: 12,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없음',
    example: {
      status: 404,
      message: '사용자를 찾을 수 없습니다.',
      result: false,
      data: { errorCode: 'USER_NOT_FOUND' },
    },
  })
  @Get(':userId/profile')
  async getUserProfileById(@Param('userId') userId: string) {
    try {
      const result = await this.userService.getPublicUserProfile(userId);

      if (!result) {
        throw new ResourceNotFoundException(
          '사용자',
          userId,
          ErrorCode.USER_NOT_FOUND,
        );
      }

      return ApiResponseDto.success(
        result,
        '사용자 프로필 조회가 완료되었습니다.',
      );
    } catch (error: unknown) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw new ValidationException(
        '사용자 프로필 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
