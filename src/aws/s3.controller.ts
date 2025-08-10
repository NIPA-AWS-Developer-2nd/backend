import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import {
  CreatePresignedUrlDto,
  CreateMultiplePresignedUrlsDto,
  CreateProfileImagePresignedUrlDto,
} from './dto/s3.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: User;
}

@ApiTags('File Upload')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '단일 이미지 업로드용 Presigned URL 생성',
    description:
      '클라이언트가 S3에 직접 업로드할 수 있는 임시 URL을 생성합니다.',
  })
  @ApiBody({
    type: CreatePresignedUrlDto,
    examples: {
      profileImage: {
        summary: '사용자 프로필 이미지 업로드',
        value: {
          folder: 'profiles',
        },
      },
      meetingThumbnail: {
        summary: '모임 썸네일 이미지 업로드',
        value: {
          folder: 'meeting_thumbnails',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL 생성 성공',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Presigned URL이 생성되었습니다.' },
        result: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            uploadUrl: {
              type: 'string',
              example:
                'https://halsaram-assets.s3.amazonaws.com/profiles/uuid.jpg?AWSAccessKeyId=...',
            },
            key: { type: 'string', example: 'profiles/uuid.jpg' },
            publicUrl: {
              type: 'string',
              example: 'https://cdn.halsaram.com/profiles/uuid.jpg',
            },
            expiresIn: { type: 'number', example: 300 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 AWS 오류',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Presigned URL 생성에 실패했습니다.',
        },
        result: { type: 'boolean', example: false },
      },
    },
  })
  async createPresignedUrl(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreatePresignedUrlDto,
  ) {
    try {
      const result = await this.s3Service.generatePresignedUrl(
        dto.folder,
        dto.expiresIn ?? 300,
        dto.contentType,
      );

      return {
        status: 200,
        message: 'Presigned URL이 생성되었습니다.',
        result: true,
        data: result,
      };
    } catch (error: unknown) {
      return {
        status: 400,
        message:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        result: false,
      };
    }
  }

  @Post('presigned-urls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '다중 이미지 업로드용 Presigned URL 생성',
    description:
      '여러 개의 이미지를 한번에 업로드할 수 있는 임시 URL들을 생성합니다.',
  })
  @ApiBody({
    type: CreateMultiplePresignedUrlsDto,
    examples: {
      verificationImages: {
        summary: '인증 다중 이미지 업로드',
        value: {
          count: 3,
          folder: 'verifications',
          expiresIn: 600,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '다중 Presigned URL 생성 성공',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: '다중 Presigned URL이 생성되었습니다.',
        },
        result: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              uploadUrl: { type: 'string' },
              key: { type: 'string' },
              publicUrl: { type: 'string' },
              expiresIn: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 AWS 오류',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Presigned URL 생성에 실패했습니다.',
        },
        result: { type: 'boolean', example: false },
      },
    },
  })
  async createMultiplePresignedUrls(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateMultiplePresignedUrlsDto,
  ) {
    try {
      const results = await this.s3Service.generateMultiplePresignedUrls(
        dto.count,
        dto.folder,
        dto.expiresIn ?? 300,
      );

      return {
        status: 200,
        message: '다중 Presigned URL이 생성되었습니다.',
        result: true,
        data: results,
      };
    } catch (error: unknown) {
      return {
        status: 400,
        message:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        result: false,
      };
    }
  }

  @Post('profile-image-presigned-url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '프로필 이미지 업로드용 Presigned URL 생성',
    description:
      '사용자별 고유한 프로필 이미지 업로드를 위한 임시 URL을 생성합니다. 기존 프로필 이미지는 덮어쓰여집니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 이미지 Presigned URL 생성 성공',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: '프로필 이미지 Presigned URL이 생성되었습니다.',
        },
        result: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            uploadUrl: {
              type: 'string',
              example:
                'https://halsaram-assets.s3.amazonaws.com/original/profiles/01HQXXX...?AWSAccessKeyId=...',
            },
            key: { type: 'string', example: 'original/profiles/01HQXXX.jpg' },
            publicUrl: {
              type: 'string',
              example: 'https://cdn.halsaram.com/original/profiles/01HQXXX.jpg',
            },
            expiresIn: { type: 'number', example: 300 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 또는 AWS 오류',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: '프로필 이미지 Presigned URL 생성에 실패했습니다.',
        },
        result: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증이 필요합니다',
  })
  async createProfileImagePresignedUrl(
    @Request() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CreateProfileImagePresignedUrlDto,
  ) {
    try {
      // JwtStrategy가 User 객체를 반환하므로 req.user.id 사용
      const userId = req.user?.id;

      if (!userId) {
        throw new Error('사용자 ID를 찾을 수 없습니다.');
      }

      const result = await this.s3Service.generateProfileImagePresignedUrl(
        userId,
        dto.expiresIn ?? 300,
        dto.contentType,
      );

      return {
        status: 200,
        message: '프로필 이미지 Presigned URL이 생성되었습니다.',
        result: true,
        data: result,
      };
    } catch (error: unknown) {
      return {
        status: 400,
        message:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        result: false,
      };
    }
  }
}
