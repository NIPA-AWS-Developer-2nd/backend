import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private cloudFrontDomain: string;

  constructor(private configService: ConfigService) {
    // 환경변수 검증
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    const cloudFrontDomain = this.configService.get<string>(
      'AWS_CLOUDFRONT_DOMAIN',
    );

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'AWS 환경변수가 설정되지 않았습니다. AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME을 확인해주세요.',
      );
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = bucketName;
    this.cloudFrontDomain = cloudFrontDomain || '';
  }

  /**
   * 이미지 업로드용 Presigned URL을 생성합니다 (권장 방식)
   * @param fileName - 원본 파일명
   * @param contentType - 파일 MIME 타입
   * @param folder - S3 내 폴더 경로 (선택사항)
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Presigned URL 정보
   */
  async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder?: string,
    expiresIn: number = 300,
  ): Promise<PresignedUrlResult> {
    // 파일 확장자 검증
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(contentType)) {
      throw new Error('지원하지 않는 이미지 형식입니다.');
    }

    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      // Presigned URL 생성
      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      const publicUrl = this.cloudFrontDomain
        ? `https://${this.cloudFrontDomain}/${key}`
        : `https://${this.bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${key}`;

      return {
        uploadUrl,
        key,
        publicUrl,
        expiresIn,
      };
    } catch (error) {
      throw new Error(`Presigned URL 생성 실패: ${error.message}`);
    }
  }

  /**
   * 여러 이미지용 Presigned URL들을 생성합니다
   * @param fileInfos - 파일 정보들 [{fileName, contentType}]
   * @param folder - S3 내 폴더 경로 (선택사항)
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Presigned URL 정보들
   */
  async generateMultiplePresignedUrls(
    fileInfos: Array<{ fileName: string; contentType: string }>,
    folder?: string,
    expiresIn: number = 300,
  ): Promise<PresignedUrlResult[]> {
    const urlPromises = fileInfos.map((fileInfo) =>
      this.generatePresignedUrl(
        fileInfo.fileName,
        fileInfo.contentType,
        folder,
        expiresIn,
      ),
    );
    return Promise.all(urlPromises);
  }
}
