import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: '모든 미션 카테고리 조회',
    description: '활성화된 모든 미션 카테고리 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
    example: {
      status: 200,
      message: '카테고리 목록을 성공적으로 조회했습니다.',
      result: true,
      data: [
        {
          id: 1,
          name: '음식',
          slug: 'food',
          icon: 'Utensils',
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findAll() {
    const categories = await this.categoryService.findAll();
    return ApiResponseDto.success(
      categories,
      '카테고리 목록을 성공적으로 조회했습니다.',
    );
  }
}
