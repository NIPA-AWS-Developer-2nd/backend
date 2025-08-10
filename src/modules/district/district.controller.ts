import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DistrictService } from './district.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('District')
@Controller('districts')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '지역 정보 조회',
    description:
      '활성화된 모든 지역 정보를 조회합니다. groupBy=city 파라미터로 시별로 그룹화할 수 있습니다.',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    description: 'city로 설정 시 시별로 그룹화하여 반환',
    example: 'city',
  })
  @ApiResponse({
    status: 200,
    description: '지역 정보 조회 성공',
    example: {
      status: 200,
      message: '지역 정보를 성공적으로 조회했습니다.',
      result: true,
      data: [
        {
          id: '01HQXXX...',
          regionCode: '11010',
          districtName: '종로구',
          city: '서울특별시',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll(@Query('groupBy') groupBy?: string) {
    if (groupBy === 'city') {
      const groupedDistricts = await this.districtService.findByCity();
      return ApiResponseDto.success(
        groupedDistricts,
        '지역 정보를 시별로 그룹화하여 성공적으로 조회했습니다.',
      );
    }

    const districts = await this.districtService.findAll();
    return ApiResponseDto.success(
      districts,
      '지역 정보를 성공적으로 조회했습니다.',
    );
  }
}
