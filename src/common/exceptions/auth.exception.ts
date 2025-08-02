import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthenticationException extends HttpException {
  constructor(message = '인증이 필요합니다') {
    super(
      {
        error: 'Authentication Required',
        message,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class AuthorizationException extends HttpException {
  constructor(message = '권한이 없습니다') {
    super(
      {
        error: 'Forbidden',
        message,
        statusCode: HttpStatus.FORBIDDEN,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message = '유효하지 않은 토큰입니다') {
    super(
      {
        error: 'Invalid Token',
        message,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message = '토큰이 만료되었습니다') {
    super(
      {
        error: 'Token Expired',
        message,
        statusCode: HttpStatus.UNAUTHORIZED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
