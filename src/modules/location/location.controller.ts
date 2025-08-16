import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LocationService, ReverseGeocodeResponse } from './location.service';

@ApiTags('Location')
@Controller('location')
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) {}

  @Get('reverse-geocode')
  @ApiOperation({
    summary: '좌표를 주소로 변환',
    description: '위도/경도 좌표를 한국 주소 정보로 변환합니다.',
  })
  @ApiQuery({
    name: 'lat',
    description: '위도',
    type: Number,
    example: 37.5665,
  })
  @ApiQuery({
    name: 'lng',
    description: '경도',
    type: Number,
    example: 126.978,
  })
  @ApiResponse({
    status: 200,
    description: '주소 변환 성공',
    schema: {
      example: {
        address: '서울특별시 중구 을지로 100',
        region: {
          area1: '서울특별시',
          area2: '중구',
          area3: '을지로동',
        },
        roadAddress: '서울특별시 중구 을지로 100',
        jibunAddress: '서울특별시 중구 을지로동 1-1',
      },
    },
  })
  async reverseGeocode(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ): Promise<ReverseGeocodeResponse> {
    this.logger.log(`Reverse geocode request: lat=${lat}, lng=${lng}`);

    const latNum = parseFloat(lat.toString());
    const lngNum = parseFloat(lng.toString());

    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new Error('Invalid coordinates provided');
    }

    return await this.locationService.reverseGeocode(latNum, lngNum);
  }
}
