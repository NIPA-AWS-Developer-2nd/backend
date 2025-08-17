import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GiftCardService } from './gift-card.service';
import { GetGiftCardsQueryDto } from './dto/get-gift-cards-query.dto';

@ApiTags('GiftCards')
@Controller('gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Get()
  @ApiOperation({
    summary: '기프티콘 목록 조회',
    description: '카테고리, 브랜드별로 기프티콘 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '기프티콘 목록 조회 성공',
    example: {
      status: 200,
      message: '기프티콘 목록 조회에 성공했습니다.',
      result: true,
      data: {
        page: 1,
        size: 20,
        totalElements: 6,
        totalPages: 1,
        data: [
          {
            id: '01HQXXX...',
            brand: '스타벅스',
            name: '아이스 카페 아메리카노 T',
            points: 3990,
            imageUrl: 'https://cdn.giftistar.net/upload/...',
            category: 'coffee_beverage',
            isActive: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  async getGiftCards(@Query() query: GetGiftCardsQueryDto) {
    return this.giftCardService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '기프티콘 상세 조회',
    description: 'ID로 기프티콘 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '기프티콘 상세 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '기프티콘을 찾을 수 없습니다.',
  })
  async getGiftCardById(@Param('id') id: string) {
    return this.giftCardService.findById(id);
  }
}
