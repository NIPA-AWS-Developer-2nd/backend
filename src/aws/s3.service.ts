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
   *
   * 클라이언트가 서버를 거치지 않고 S3에 직접 업로드할 수 있는 임시 URL을 생성합니다.
   *
   * @param fileName - 원본 파일명 (예: 'profile.jpg')
   * @param contentType - 파일 MIME 타입 ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
   * @param folder - S3 내 폴더 경로 (선택사항, 예: 'profiles', 'gallery')
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Promise<PresignedUrlResult> - uploadUrl, publicUrl, key, expiresIn 포함
   * @throws Error - 지원하지 않는 파일 형식이거나 AWS 에러 발생 시
   *
   * @example
   * ```typescript
   * const result = await s3Service.generatePresignedUrl(
   *   'profile.jpg',
   *   'image/jpeg',
   *   'profiles'
   * );
   * // result.uploadUrl로 PUT 요청하여 업로드
   * // result.publicUrl로 업로드된 이미지 접근
   * ```
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
   * 여러 이미지용 Presigned URL들을 한번에 생성합니다
   *
   * 다중 파일 업로드를 위해 여러 개의 Presigned URL을 동시에 생성합니다.
   *
   * @param fileInfos - 파일 정보 배열 [{fileName: string, contentType: string}]
   * @param folder - S3 내 폴더 경로 (선택사항, 모든 파일에 공통 적용)
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Promise<PresignedUrlResult[]> - 각 파일별 Presigned URL 정보 배열
   * @throws Error - 지원하지 않는 파일 형식이 포함되어 있거나 AWS 에러 발생 시
   *
   * @example
   * ```typescript
   * const results = await s3Service.generateMultiplePresignedUrls([
   *   { fileName: 'image1.jpg', contentType: 'image/jpeg' },
   *   { fileName: 'image2.png', contentType: 'image/png' }
   * ], 'gallery');
   *
   * // 각 result.uploadUrl로 개별 업로드 수행
   * ```
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
