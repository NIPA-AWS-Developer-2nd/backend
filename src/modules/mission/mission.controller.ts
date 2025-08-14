import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MissionService } from './mission.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RequireLocationVerification } from '../../auth/decorators/location-verified.decorator';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';
import { GetMissionsQueryDto } from './dto/get-missions-query.dto';

@ApiTags('Mission')
@Controller('missions')
@UseGuards(LocationVerifiedGuard)
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: '미션 목록 조회',
    description: '필터링된 미션 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: '카테고리 필터 (all 또는 특정 카테고리명)',
    example: 'culture',
  })
  @ApiQuery({
    name: 'difficulty',
    required: false,
    description: '난이도 필터 (EASY, MEDIUM, HARD)',
    example: 'HARD',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 항목 수 (기본값: 5)',
    example: 5,
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
    description: '미션 목록 조회 성공',
    example: {
      status: 200,
      message: '미션 목록을 성공적으로 조회했습니다.',
      result: true,
      data: {
        missions: [
          {
            id: '01HQXXX-CULTURE-LOTTE',
            title: '송파구 롯데월드 어트랙션 체험',
            description:
              '송파구 롯데월드에서 5개 이상의 어트랙션을 체험하고 사진을 공유하세요.',
            point: 1200,
            duration: 240,
            minParticipants: 4,
            maxParticipants: 10,
            minDuration: 180,
            minPhotoCount: 5,
            difficulty: 'HARD',
            regionCode: '11710',
            thumbnailUrl:
              'https://images.unsplash.com/photo-1465996140498-df84be101126?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            category: ['culture'],
            status: 'ACTIVE',
            createdBy: 'admin',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 5,
          totalItems: 25,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    },
  })
  async findAll(@Query() query: GetMissionsQueryDto) {
    const result = await this.missionService.findAll(query);
    return ApiResponseDto.success(
      result,
      '미션 목록을 성공적으로 조회했습니다.',
    );
  }

  @RequireLocationVerification()
  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({
    summary: '미션 상세 조회',
    description: '특정 미션의 상세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'id',
    description: '미션 ID (ULID)',
    example: '01HQXXX-CULTURE-LOTTE',
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
    description: '미션 상세 조회 성공',
    example: {
      status: 200,
      message: '미션 상세 정보를 성공적으로 조회했습니다.',
      result: true,
      data: {
        id: '01HQXXX-CULTURE-LOTTE',
        title: '송파구 롯데월드 어트랙션 체험',
        description:
          '송파구 롯데월드에서 5개 이상의 어트랙션을 체험하고 사진을 공유하세요.',
        point: 1200,
        duration: 240,
        minParticipants: 4,
        maxParticipants: 10,
        minDuration: 180,
        minPhotoCount: 1,
        difficulty: 'HARD',
        region_code: '11710',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1465996140498-df84be101126',
        category: ['culture'],
        status: 'ACTIVE',
        createdBy: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '미션을 찾을 수 없음',
    example: {
      status: 404,
      message: '미션을 찾을 수 없습니다.',
      result: false,
    },
  })
  async findOne(@Param('id') id: string) {
    const mission = await this.missionService.findOne(id);

    if (!mission) {
      throw new NotFoundException('미션을 찾을 수 없습니다.');
    }

    return ApiResponseDto.success(
      mission,
      '미션 상세 정보를 성공적으로 조회했습니다.',
    );
  }
}
