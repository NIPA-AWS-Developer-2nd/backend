# AWS S3 서비스 사용 가이드

## 개요

이 문서는 API 개발자가 AWS S3 업로드 기능을 사용하는 방법을 설명합니다.

## S3Service 사용법

### 1. 모듈에 AwsModule import

```typescript
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [AwsModule],
  // ...
})
export class YourModule {}
```

### 2. 서비스에 S3Service 주입

```typescript
import { S3Service } from '../aws/s3.service';

@Injectable()
export class YourService {
  constructor(private readonly s3Service: S3Service) {}

  // 권장 방식: Presigned URL 사용
  async generateUploadUrl(fileName: string, contentType: string) {
    const result = await this.s3Service.generatePresignedUrl(
      fileName,
      contentType,
      'profile-images',
    );
    return result;
  }

  // 레거시 방식: 직접 업로드 (권장하지 않음)
  async handleImageUpload(file: Express.Multer.File) {
    const result = await this.s3Service.uploadImage(file, 'profile-images');
    return result;
  }
}
```

### 3. Controller에서 Presigned URL 생성

```typescript
@Controller('your-endpoint')
export class YourController {
  constructor(private readonly yourService: YourService) {}

  @Post('upload-url')
  async generateUploadUrl(
    @Body() body: { fileName: string; contentType: string },
  ) {
    const result = await this.yourService.generateUploadUrl(
      body.fileName,
      body.contentType,
    );
    return { success: true, data: result };
  }
}
```

### 4. 클라이언트에서 사용 방법

```javascript
// 1. 백엔드에서 Presigned URL 받기
const response = await fetch('/your-endpoint/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'image.jpg',
    contentType: 'image/jpeg',
  }),
});
const { uploadUrl, publicUrl } = await response.json();

// 2. S3에 직접 업로드
await fetch(uploadUrl, {
  method: 'PUT',
  body: fileBlob,
  headers: { 'Content-Type': 'image/jpeg' },
});

// 3. publicUrl을 데이터베이스에 저장하거나 사용
console.log('업로드 완료:', publicUrl);
```

## API 메서드

### generatePresignedUrl(fileName, contentType, folder?, expiresIn?) - 권장

- **파라미터**:
  - `fileName`: string - 원본 파일명
  - `contentType`: string - MIME 타입 (예: 'image/jpeg')
  - `folder`: string (선택) - S3 내 폴더 경로
  - `expiresIn`: number (선택) - 만료 시간(초, 기본값: 300)
- **반환값**: `PresignedUrlResult` - { uploadUrl, key, publicUrl, expiresIn }

### generateMultiplePresignedUrls(fileInfos, folder?, expiresIn?)

- **파라미터**:
  - `fileInfos`: Array<{fileName, contentType}> - 파일 정보들
  - `folder`: string (선택) - S3 내 폴더 경로
  - `expiresIn`: number (선택) - 만료 시간(초, 기본값: 300)
- **반환값**: `PresignedUrlResult[]` - Presigned URL 결과 배열

### uploadImage(file, folder?) - 레거시

- **파라미터**:
  - `file`: Express.Multer.File - 업로드할 파일
  - `folder`: string (선택) - S3 내 폴더 경로
- **반환값**: `UploadResult` - { url, key, bucket }

### uploadMultipleImages(files, folder?) - 레거시

- **파라미터**:
  - `files`: Express.Multer.File[] - 업로드할 파일들
  - `folder`: string (선택) - S3 내 폴더 경로
- **반환값**: `UploadResult[]` - 업로드 결과 배열

## 환경 변수 설정

`.env` 파일에 다음 변수들이 설정되어 있어야 합니다:

```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_CLOUDFRONT_DOMAIN=cdn.halsaram.site
```

**참고**: `AWS_CLOUDFRONT_DOMAIN`이 설정되어 있으면 CloudFront URL을 사용하고, 없으면 S3 직접 URL을 사용합니다.

## 향후 확장 가능성

`src/aws/` 디렉토리에는 S3 외에도 다른 AWS 서비스들을 추가할 수 있습니다:

- `ses.service.ts` - 이메일 발송
- `sns.service.ts` - 푸시 알림
- `lambda.service.ts` - Lambda 함수 호출
- 등등...
