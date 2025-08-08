import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../types/common.types';

export class AuthenticationException extends HttpException {
  constructor(
    message = '인증이 필요합니다',
    errorCode = ErrorCode.AUTH_UNAUTHORIZED,
  ) {
    super(
      {
        error: 'Authentication Required',
        message,
        errorCode,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AuthorizationException extends HttpException {
  constructor(
    message = '권한이 없습니다',
    errorCode = ErrorCode.AUTH_UNAUTHORIZED,
  ) {
    super(
      {
        error: 'Forbidden',
        message,
        errorCode,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor(
    message = '유효하지 않은 토큰입니다',
    errorCode = ErrorCode.AUTH_TOKEN_INVALID,
  ) {
    super(
      {
        error: 'Invalid Token',
        message,
        errorCode,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenExpiredException extends HttpException {
  constructor(
    message = '토큰이 만료되었습니다',
    errorCode = ErrorCode.AUTH_TOKEN_EXPIRED,
  ) {
    super(
      {
        error: 'Token Expired',
        message,
        errorCode,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
