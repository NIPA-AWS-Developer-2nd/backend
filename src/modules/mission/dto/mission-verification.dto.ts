import { IsString, IsOptional, IsNumber, Min, Max, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyMissionDto {
  @ApiProperty({ 
    description: '미션 사진 URL (S3 업로드 후)',
    example: 'https://bucket.s3.amazonaws.com/mission-photos/photo123.jpg'
  })
  @IsString()
  @IsUrl()
  photoUrl: string;

  @ApiProperty({ 
    description: '모임 ID',
    example: '01HQXXX...'
  })
  @IsString()
  meetingId: string;
}

export class SubmitMissionDto {
  @ApiProperty({ 
    description: '모임 ID',
    example: '01HQXXX...'
  })
  @IsString()
  meetingId: string;

  @ApiProperty({ 
    description: '미션 사진 URL',
    example: 'https://bucket.s3.amazonaws.com/mission-photos/photo123.jpg'
  })
  @IsString()
  @IsUrl()
  photoUrl: string;

  @ApiPropertyOptional({ 
    description: '별점 (1-5점)',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ 
    description: '후기 텍스트',
    example: '정말 즐거운 미션이었습니다!'
  })
  @IsOptional()
  @IsString()
  reviewText?: string;
}