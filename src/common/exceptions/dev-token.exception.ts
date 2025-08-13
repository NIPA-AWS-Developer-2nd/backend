import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../types/common.types';

interface ErrorResponse {
  message: string;
  errorCode: string;
}

export class DevTokenProductionException extends HttpException {
  constructor(
    message: string = '개발용 API는 프로덕션 환경에서 사용할 수 없습니다.',
  ) {
    const errorResponse: ErrorResponse = {
      message,
      errorCode: ErrorCode.SYSTEM_DEV_TOKEN_PRODUCTION_ERROR,
    };
    super(errorResponse, HttpStatus.BAD_REQUEST);
  }
}

export class DevTokenGenerationException extends HttpException {
  constructor(message: string = '토큰 발급 중 오류가 발생했습니다.') {
    const errorResponse: ErrorResponse = {
      message,
      errorCode: ErrorCode.SYSTEM_DEV_TOKEN_GENERATION_ERROR,
    };
    super(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
