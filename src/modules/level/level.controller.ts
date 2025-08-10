import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LevelService } from './level.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { ResourceNotFoundException } from '../../common/exceptions';

@ApiTags('Level')
@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '모든 레벨 정보 조회',
    description: '시스템에 정의된 모든 레벨 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '레벨 정보 조회 성공',
    example: {
      status: 200,
      message: '레벨 정보를 성공적으로 조회했습니다.',
      result: true,
      data: [
        {
          id: 1,
          requiredPoints: 0,
          name: '새싹',
          rewardAiTickets: 0,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async getAllLevels() {
    const levels = await this.levelService.getAllLevels();
    return ApiResponseDto.success(
      levels,
      '레벨 정보를 성공적으로 조회했습니다.',
    );
  }

  @Public()
  @Get(':level')
  @ApiOperation({
    summary: '특정 레벨 정보 조회',
    description:
      '레벨 값을 보내면 해당 레벨업에 필요한 전체 경험치 정보를 응답합니다.',
  })
  @ApiParam({
    name: 'level',
    description: '조회할 레벨 (1부터 시작)',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: '레벨 정보 조회 성공',
    example: {
      status: 200,
      message: '레벨 정보를 성공적으로 조회했습니다.',
      result: true,
      data: {
        level: 1,
        requiredPoints: 0,
        name: '새싹',
        rewardAiTickets: 0,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '레벨 정보를 찾을 수 없음',
    example: {
      status: 404,
      message: '레벨 1에 대한 정보를 찾을 수 없습니다.',
      result: false,
    },
  })
  async getLevelInfo(@Param('level', ParseIntPipe) level: number) {
    try {
      const levelInfo = await this.levelService.getLevelInfo(level);
      return ApiResponseDto.success(
        levelInfo,
        '레벨 정보를 성공적으로 조회했습니다.',
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new ResourceNotFoundException(error.message);
      }
      throw error;
    }
  }
}
