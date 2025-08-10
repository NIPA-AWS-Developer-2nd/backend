import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserHashtagsService } from './user-hashtags.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('User Hashtags')
@Controller('user-hashtags')
export class UserHashtagsController {
  constructor(private readonly userHashtagsService: UserHashtagsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '모든 사용자 해시태그 조회',
    description: '활성화된 모든 사용자 해시태그 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 해시태그 목록 조회 성공',
    example: {
      status: 200,
      message: '사용자 해시태그 목록을 성공적으로 조회했습니다.',
      result: true,
      data: [
        {
          id: 1,
          name: '활발한',
          slug: 'active',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    const hashtags = await this.userHashtagsService.findAll();
    return ApiResponseDto.success(
      hashtags,
      '사용자 해시태그 목록을 성공적으로 조회했습니다.',
    );
  }
}
