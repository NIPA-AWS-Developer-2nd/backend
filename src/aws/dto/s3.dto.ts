import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreatePresignedUrlDto {
  @ApiProperty({
    description: 'S3 내 폴더 경로',
    example: 'profiles',
    enum: ['profiles', 'meeting_thumbnails'],
  })
  @IsString()
  @IsNotEmpty()
  folder: string;

  @ApiProperty({
    description: '파일의 Content-Type',
    example: 'image/jpeg',
    required: false,
  })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({
    description: 'URL 만료 시간 (초)',
    example: 300,
    default: 300,
    minimum: 60,
    maximum: 3600,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(3600)
  expiresIn?: number;
}

export class CreateMultiplePresignedUrlsDto {
  @ApiProperty({
    description: '생성할 URL 개수',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  count: number;

  @ApiProperty({
    description: 'S3 내 폴더 경로',
    example: 'verifications',
    enum: ['verifications'],
  })
  @IsString()
  @IsNotEmpty()
  folder: string;

  @ApiProperty({
    description: 'URL 만료 시간 (초)',
    example: 300,
    default: 300,
    minimum: 60,
    maximum: 3600,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(3600)
  expiresIn?: number;
}

export class CreateProfileImagePresignedUrlDto {
  @ApiProperty({
    description: '파일의 Content-Type',
    example: 'image/jpeg',
    required: false,
  })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({
    description: 'URL 만료 시간 (초)',
    example: 300,
    default: 300,
    minimum: 60,
    maximum: 3600,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(3600)
  expiresIn?: number;
}

export class CreateMissionVerificationPresignedUrlDto {
  @ApiProperty({
    description: '미션 ID (ULID)',
    example: '01HQXXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  missionId: string;

  @ApiProperty({
    description: '모임 ID (ULID)',
    example: '01HQXXXXXXXXXXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  meetingId: string;

  @ApiProperty({
    description: '미션 스텝 인덱스 (0부터 시작)',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  stepIndex: number;

  @ApiProperty({
    description: '파일의 Content-Type',
    example: 'image/jpeg',
    required: false,
  })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({
    description: 'URL 만료 시간 (초)',
    example: 300,
    default: 300,
    minimum: 60,
    maximum: 3600,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(3600)
  expiresIn?: number;
}
