## Halsaram API

### 변경 이력

- **2025-07-31**
  - DB 및 Swagger 셋업 완료
  - DB 연결을 위해 `.env` 파일 필요 (노션 팀 문서 참고)
- **2025-08-02**
  - [https://api.halsaram.site](https://api.halsaram.site) API 서버 배포
- **2025-08-03**
  - Postgres SSL 설정 추가
  - 예외 처리 및 로깅 설정 추가
  - 카카오, 네이버, 구글 OAuth API 구현 (사용자 정보는 DB에 저장하지 않음)
- **2025-08-08**
  - Entities 추가
  - TypeORM 설정, 마이그레이션 추가
  - Seeder 추가
  - JWT 가드 구현
- **2025-08-16**
  - Cool SMS API 통합 완료
  - 전화번호 인증 SMS 발송 기능 구현