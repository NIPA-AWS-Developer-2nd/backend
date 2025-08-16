import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetHomeDataDto {
  @ApiProperty({
    description: '추천 미션/모임 최대 개수',
    minimum: 1,
    maximum: 20,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(value as string))
  limit?: number = 10;
}
