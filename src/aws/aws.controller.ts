import { Controller, Post, Body, Get } from '@nestjs/common';
import { S3Service } from './s3.service';
import {
  GeneratePresignedUrlDto,
  GenerateMultiplePresignedUrlsDto,
} from './dto/presigned-url.dto';

@Controller('aws/test')
export class AwsController {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * 단일 Presigned URL 생성 테스트
   * POST /aws/test/presigned-url
   */
  @Post('presigned-url')
  async generatePresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    try {
      const result = await this.s3Service.generatePresignedUrl(
        dto.fileName,
        dto.contentType,
        dto.folder,
      );

      return {
        success: true,
        message: 'Presigned URL 생성 성공',
        data: result,
        instructions: {
          step1: '아래 uploadUrl로 PUT 요청을 보내세요',
          step2: 'Content-Type 헤더를 설정하세요',
          step3: '업로드 완료 후 publicUrl로 접근 가능합니다',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 다중 Presigned URL 생성 테스트
   * POST /aws/test/presigned-urls
   */
  @Post('presigned-urls')
  async generateMultiplePresignedUrls(
    @Body() dto: GenerateMultiplePresignedUrlsDto,
  ) {
    try {
      const results = await this.s3Service.generateMultiplePresignedUrls(
        dto.files,
        dto.folder,
      );

      return {
        success: true,
        message: '다중 Presigned URL 생성 성공',
        data: results,
        count: results.length,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 테스트 가이드 제공
   * GET /aws/test/guide
   */
  @Get('guide')
  getTestGuide() {
    return {
      title: 'AWS S3 Presigned URL 테스트 가이드',
      endpoints: {
        single: {
          method: 'POST',
          url: '/aws/test/presigned-url',
          body: {
            fileName: 'test-image.jpg',
            contentType: 'image/jpeg',
            folder: 'test-uploads', // 선택사항
          },
        },
        multiple: {
          method: 'POST',
          url: '/aws/test/presigned-urls',
          body: {
            files: [
              { fileName: 'image1.jpg', contentType: 'image/jpeg' },
              { fileName: 'image2.png', contentType: 'image/png' },
            ],
            folder: 'test-uploads', // 선택사항
          },
        },
      },
      howToUpload: {
        step1: 'Presigned URL을 받은 후',
        step2: 'curl 또는 Postman으로 PUT 요청',
        example: `curl -X PUT "받은_uploadUrl" \\
  -H "Content-Type: image/jpeg" \\
  --data-binary @your-image.jpg`,
      },
      supportedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };
  }
}
