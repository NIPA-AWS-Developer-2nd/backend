import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ulid } from 'ulid';

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

export interface MissionVerificationPresignedUrlResult
  extends PresignedUrlResult {
  metadata: {
    [key: string]: string;
  };
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
   * 이미지 업로드용 Presigned URL을 생성합니다
   *
   * 클라이언트가 서버를 거치지 않고 S3에 직접 업로드할 수 있는 임시 URL을 생성합니다.
   * 모든 이미지 타입(jpg, png, gif, webp)을 지원합니다.
   *
   * @param folder - S3 내 폴더 경로 (예: 'profiles', 'meeting_thumbnails')
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Promise<PresignedUrlResult> - uploadUrl, publicUrl, key, expiresIn 포함
   *
   * @example
   * ```typescript
   * const result = await s3Service.generatePresignedUrl('profiles');
   * // result.uploadUrl로 PUT 요청하여 이미지 업로드
   * // result.publicUrl로 업로드된 이미지 접근
   * ```
   */
  async generatePresignedUrl(
    folder: string,
    expiresIn: number = 300,
    contentType?: string,
  ): Promise<PresignedUrlResult> {
    // 고유 파일명 생성 (확장자는 업로드 시 결정)
    const uniqueFileName = ulid();
    const key = `original/${folder}/${uniqueFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType || 'image/jpeg', // Content-Type 설정
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
    } catch (error: unknown) {
      throw new Error(
        `Presigned URL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }

  /**
   * 프로필 이미지용 Presigned URL을 생성합니다
   *
   * 사용자별로 고유한 프로필 이미지를 위해 userId를 파일명으로 사용합니다.
   * 기존 이미지가 있으면 덮어쓰게 됩니다.
   *
   * @param userId - 사용자 ID (ULID)
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Promise<PresignedUrlResult> - uploadUrl, publicUrl, key, expiresIn 포함
   *
   * @example
   * ```typescript
   * const result = await s3Service.generateProfileImagePresignedUrl(userId);
   * // result.uploadUrl로 PUT 요청하여 프로필 이미지 업로드
   * ```
   */
  async generateProfileImagePresignedUrl(
    userId: string,
    expiresIn: number = 300,
    contentType?: string,
  ): Promise<PresignedUrlResult> {
    // userId를 파일명으로 사용 (확장자 없이)
    const key = `original/profiles/${userId}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType || 'image/jpeg', // Content-Type 설정
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
    } catch (error: unknown) {
      throw new Error(
        `프로필 이미지 Presigned URL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }

  /**
   * 여러 이미지용 Presigned URL들을 한번에 생성합니다
   *
   * 다중 파일 업로드를 위해 여러 개의 Presigned URL을 동시에 생성합니다.
   *
   * @param count - 생성할 URL 개수
   * @param folder - S3 내 폴더 경로 (예: 'verifications')
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @returns Promise<PresignedUrlResult[]> - 각 파일별 Presigned URL 정보 배열
   *
   * @example
   * ```typescript
   * const results = await s3Service.generateMultiplePresignedUrls(3, 'verifications');
   *
   * // 각 result.uploadUrl로 개별 업로드 수행
   * ```
   */
  async generateMultiplePresignedUrls(
    count: number,
    folder: string,
    expiresIn: number = 300,
  ): Promise<PresignedUrlResult[]> {
    const urlPromises = Array.from({ length: count }, () =>
      this.generatePresignedUrl(folder, expiresIn),
    );
    return Promise.all(urlPromises);
  }

  /**
   * 미션 인증 사진용 Presigned URL을 생성합니다
   *
   * 미션 인증 사진을 위한 특별한 키 포맷과 메타데이터가 포함된 Presigned URL을 생성합니다.
   * 키 포맷: mission-uploads/{missionId}/{meetingId}/{userId}/{stepIndex}/{unixTs}-{rand}.jpg
   *
   * @param missionId - 미션 ID (ULID)
   * @param meetingId - 모임 ID (ULID)
   * @param userId - 사용자 ID (ULID)
   * @param stepIndex - 미션 스텝 인덱스
   * @param startTs - 미션 시작 타임스탬프
   * @param deadlineTs - 미션 마감 타임스탬프
   * @param expiresIn - URL 만료 시간 (초, 기본값: 300초/5분)
   * @param contentType - 파일의 Content-Type
   * @returns Promise<MissionVerificationPresignedUrlResult> - 메타데이터가 포함된 Presigned URL 정보
   *
   * @example
   * ```typescript
   * const result = await s3Service.generateMissionVerificationPresignedUrl(
   *   missionId, meetingId, userId, 0, startTs, deadlineTs
   * );
   * // result.uploadUrl로 PUT 요청하여 인증 사진 업로드
   * // result.metadata의 헤더들을 함께 전송
   * ```
   */
  async generateMissionVerificationPresignedUrl(
    missionId: string,
    meetingId: string,
    userId: string,
    stepIndex: number,
    startTs: number,
    deadlineTs: number,
    expiresIn: number = 300,
    contentType: string = 'image/jpeg',
  ): Promise<MissionVerificationPresignedUrlResult> {
    // 고유 파일명 생성: {unixTs}-{rand}.jpg
    const unixTs = Math.floor(Date.now() / 1000);
    const rand = Math.random().toString(36).substring(2, 10); // 8자리 랜덤 문자열
    const extension = contentType.split('/')[1] || 'jpg';
    const fileName = `${unixTs}-${rand}.${extension}`;

    // 키 포맷: mission-uploads/{missionId}/{meetingId}/{userId}/{stepIndex}/{fileName}
    const key = `mission-uploads/${missionId}/${meetingId}/${userId}/${stepIndex}/${fileName}`;

    // 메타데이터 정의
    const metadata = {
      'x-amz-meta-id': missionId,
      'x-amz-meta-meetingid': meetingId,
      'x-amz-meta-userid': userId,
      'x-amz-meta-startts': startTs.toString(),
      'x-amz-meta-deadlinets': deadlineTs.toString(),
      'x-amz-meta-stepindex': stepIndex.toString(),
    };

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        Metadata: {
          id: missionId,
          meetingid: meetingId,
          userid: userId,
          startts: startTs.toString(),
          deadlinets: deadlineTs.toString(),
          stepindex: stepIndex.toString(),
        },
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
        metadata,
      };
    } catch (error: unknown) {
      throw new Error(
        `미션 인증 사진 Presigned URL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }
  }
}
