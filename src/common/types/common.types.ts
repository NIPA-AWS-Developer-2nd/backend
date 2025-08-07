// 공통 타입 정의
export type ID = string; // ULID

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  result: boolean;
  data?: T;
}

export interface PagedResponse<T> {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  data: T[];
}

// 에러 코드 열거형
export enum ErrorCode {
  // 인증 관련 (AUTH_*)
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_TOKEN_EXPIRED = 'AUTH_002',
  AUTH_TOKEN_INVALID = 'AUTH_003',
  AUTH_UNAUTHORIZED = 'AUTH_004',
  AUTH_PHONE_VERIFICATION_FAILED = 'AUTH_005',

  // 사용자 관련 (USER_*)
  USER_NOT_FOUND = 'USER_001',
  USER_ALREADY_EXISTS = 'USER_002',
  USER_PHONE_ALREADY_EXISTS = 'USER_003',
  USER_ONBOARDING_ALREADY_COMPLETED = 'USER_004',
  USER_INACTIVE = 'USER_005',

  // 검증 관련 (VALIDATION_*)
  VALIDATION_FAILED = 'VALIDATION_001',
  VALIDATION_PHONE_NUMBER_INVALID = 'VALIDATION_002',
  VALIDATION_DISTRICT_NOT_FOUND = 'VALIDATION_003',
  VALIDATION_CATEGORY_NOT_FOUND = 'VALIDATION_004',

  // 시스템 관련 (SYSTEM_*)
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_001',
  SYSTEM_DATABASE_ERROR = 'SYSTEM_002',
  SYSTEM_EXTERNAL_API_ERROR = 'SYSTEM_003',
}
