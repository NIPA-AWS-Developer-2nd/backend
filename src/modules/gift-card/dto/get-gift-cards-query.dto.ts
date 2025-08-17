import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { GiftCardCategory } from '../../../entities/gift-card.entity';

export class GetGiftCardsQueryDto {
  @ApiPropertyOptional({
    description: '기프티콘 카테고리',
    enum: GiftCardCategory,
    example: GiftCardCategory.COFFEE_BEVERAGE,
  })
  @IsOptional()
  @IsEnum(GiftCardCategory)
  category?: GiftCardCategory;

  @ApiPropertyOptional({
    description: '브랜드명',
    example: '스타벅스',
  })
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: '페이지 번호 (1부터 시작)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지 크기',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
