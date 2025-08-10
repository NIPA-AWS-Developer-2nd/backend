import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../types/common.types';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR,
    statusCode = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        error: 'Business Logic Error',
        message,
        errorCode,
        statusCode,
      },
      statusCode,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(
    message: string | string[],
    field?: string,
    errorCode = ErrorCode.VALIDATION_FAILED,
  ) {
    super(
      {
        error: 'Validation Error',
        message,
        field,
        errorCode,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(
    resource: string,
    id?: string | number,
    errorCode = ErrorCode.USER_NOT_FOUND,
  ) {
    const message = id
      ? `${resource}(ID: ${id})을(를) 찾을 수 없습니다`
      : `${resource}을(를) 찾을 수 없습니다`;

    super(
      {
        error: 'Resource Not Found',
        message,
        resource,
        id,
        errorCode,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(
    resource: string,
    field?: string,
    errorCode = ErrorCode.USER_ALREADY_EXISTS,
  ) {
    const message = field
      ? `${resource}의 ${field}이(가) 이미 존재합니다`
      : `${resource}이(가) 이미 존재합니다`;

    super(
      {
        error: 'Duplicate Resource',
        message,
        resource,
        field,
        errorCode,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}

// 인증 관련 도메인별 예외들

export class RefreshTokenInvalidException extends BusinessException {
  constructor(message = '유효하지 않은 리프레시 토큰입니다.') {
    super(
      message,
      ErrorCode.AUTH_REFRESH_TOKEN_INVALID as ErrorCode,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class RefreshTokenExpiredException extends BusinessException {
  constructor(message = '리프레시 토큰이 만료되었습니다.') {
    super(
      message,
      ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED as ErrorCode,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class VerificationFailedException extends BusinessException {
  constructor(message = '인증에 실패했습니다.') {
    super(
      message,
      ErrorCode.AUTH_PHONE_VERIFICATION_FAILED,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class AccountMergeFailedException extends BusinessException {
  constructor(message = '계정 통합에 실패했습니다.') {
    super(
      message,
      ErrorCode.AUTH_ACCOUNT_MERGE_FAILED as ErrorCode,
      HttpStatus.BAD_REQUEST,
    );
  }
}

// 사용자 관련 도메인별 예외들
export class UserNotFoundException extends ResourceNotFoundException {
  constructor(id?: string) {
    super('사용자', id, ErrorCode.USER_NOT_FOUND);
  }
}

export class OnboardingAlreadyCompletedException extends BusinessException {
  constructor(message = '이미 온보딩이 완료된 사용자입니다.') {
    super(
      message,
      ErrorCode.USER_ONBOARDING_ALREADY_COMPLETED,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class PhoneNumberAlreadyExistsException extends DuplicateResourceException {
  constructor() {
    super('전화번호', 'phoneNumber', ErrorCode.USER_PHONE_ALREADY_EXISTS);
  }
}
