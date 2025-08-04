# S3 Presigned URL 테스트 가이드

## 테스트 엔드포인트

### 1. 테스트 가이드 확인

```bash
GET http://localhost:3000/aws/test/guide
```

### 2. 단일 Presigned URL 생성

```bash
POST http://localhost:3000/aws/test/presigned-url
Content-Type: application/json

{
  "fileName": "test-image.jpg",
  "contentType": "image/jpeg",
  "folder": "test-uploads"
}
```

### 3. 다중 Presigned URL 생성

```bash
POST http://localhost:3000/aws/test/presigned-urls
Content-Type: application/json

{
  "files": [
    { "fileName": "image1.jpg", "contentType": "image/jpeg" },
    { "fileName": "image2.png", "contentType": "image/png" }
  ],
  "folder": "test-uploads"
}
```

## 실제 파일 업로드 테스트

### 1. Presigned URL 받기

위의 API를 호출하여 `uploadUrl`을 받습니다.

### 2. 파일 업로드 (curl 사용)

```bash
curl -X PUT "받은_uploadUrl" \
  -H "Content-Type: image/jpeg" \
  --data-binary @your-image.jpg
```

### 3. 파일 업로드 (Postman 사용)

1. Method: PUT
2. URL: 받은 uploadUrl
3. Headers: Content-Type: image/jpeg
4. Body: Binary → 파일 선택

### 4. 업로드 확인

- 성공 시: HTTP 200 응답
- 실패 시: 에러 메시지 확인

### 5. 업로드된 파일 확인

받은 `publicUrl`로 브라우저에서 접근하여 이미지 확인

## 지원하는 파일 형식

- image/jpeg
- image/png
- image/gif
- image/webp

## 주의사항

- Presigned URL은 5분(300초) 후 만료됩니다
- 환경변수가 올바르게 설정되어 있어야 합니다
- S3 버킷 권한이 올바르게 설정되어 있어야 합니다

## 환경변수 체크리스트

```
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_CLOUDFRONT_DOMAIN=cdn.halsaram.site
```
