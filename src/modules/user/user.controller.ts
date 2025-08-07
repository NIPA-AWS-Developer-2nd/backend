import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { User } from '../../entities/user.entity';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import {
  ResourceNotFoundException,
  DuplicateResourceException,
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

  // 내 프로필 조회
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

  // 지역 목록 조회 (공개 API)
  @ApiOperation({
    summary: '지역 목록 조회',
    description: '사용 가능한 서울시 구 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '지역 목록 조회 성공',
    example: {
      status: 200,
      message: '지역 목록 조회가 완료되었습니다.',
      result: true,
      data: [{ id: 'seoul-gangnam', name: '강남구', region: 'seoul' }],
    },
  })
  @Public()
  @Get('districts')
  async getDistricts() {
    try {
      const result = await this.userService.getDistricts();
      return ApiResponseDto.success(result, '지역 목록 조회가 완료되었습니다.');
    } catch {
      throw new ValidationException('지역 목록 조회 중 오류가 발생했습니다.');
    }
  }

  // 카테고리 목록 조회 (공개 API)
  @ApiOperation({
    summary: '카테고리 목록 조회',
    description: '사용 가능한 관심 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    example: {
      status: 200,
      message: '카테고리 목록 조회가 완료되었습니다.',
      result: true,
      data: [{ id: 1, name: '음식', icon: '🍽️' }],
    },
  })
  @Public()
  @Get('categories')
  async getCategories() {
    try {
      const result = await this.userService.getCategories();
      return ApiResponseDto.success(
        result,
        '카테고리 목록 조회가 완료되었습니다.',
      );
    } catch {
      throw new ValidationException(
        '카테고리 목록 조회 중 오류가 발생했습니다.',
      );
    }
  }

  @ApiOperation({
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다.',
  })
  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.userService.create(createUserDto);
      return ApiResponseDto.created(result, '사용자가 생성되었습니다.');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('중복')) {
        throw new DuplicateResourceException(
          '사용자',
          'phoneNumber',
          ErrorCode.USER_PHONE_ALREADY_EXISTS,
        );
      }
      throw new ValidationException('사용자 생성 중 오류가 발생했습니다.');
    }
  }

  @ApiOperation({
    summary: '사용자 목록 조회',
    description: '모든 사용자 목록을 조회합니다.',
  })
  @Public()
  @Get()
  async findAll() {
    try {
      const result = await this.userService.findAll();
      return ApiResponseDto.success(
        result,
        '사용자 목록 조회가 완료되었습니다.',
      );
    } catch {
      throw new ValidationException('사용자 목록 조회 중 오류가 발생했습니다.');
    }
  }

  @ApiOperation({
    summary: '사용자 삭제 (BO)',
    description: '지정된 사용자를 삭제합니다.',
  })
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() _user: User) {
    try {
      // TODO: 관리자 권한 체크 로직 추가
      const result = await this.userService.remove(id);
      return ApiResponseDto.success(result, '사용자가 삭제되었습니다.');
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes('찾을 수 없습니다')
      ) {
        throw new ResourceNotFoundException(
          '사용자',
          id,
          ErrorCode.USER_NOT_FOUND,
        );
      }
      throw new ValidationException('사용자 삭제 중 오류가 발생했습니다.');
    }
  }
}
