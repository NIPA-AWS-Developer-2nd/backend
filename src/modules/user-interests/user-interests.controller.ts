import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserInterestsService } from './user-interests.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('User Interests')
@Controller('user-interests')
export class UserInterestsController {
  constructor(private readonly userInterestsService: UserInterestsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '모든 사용자 관심사 조회',
    description: '활성화된 모든 사용자 관심사 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 관심사 목록 조회 성공',
    example: {
      status: 200,
      message: '사용자 관심사 목록을 성공적으로 조회했습니다.',
      result: true,
      data: [
        {
          id: 1,
          name: '음식',
          slug: 'food',
          icon: '🍽️',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    const interests = await this.userInterestsService.findAll();
    return ApiResponseDto.success(
      interests,
      '사용자 관심사 목록을 성공적으로 조회했습니다.',
    );
  }
}
