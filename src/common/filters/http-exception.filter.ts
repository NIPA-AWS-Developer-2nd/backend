import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiResponseDto } from '../dto/api-response.dto';

interface HttpExceptionResponse {
  message?: string | string[];
  errorCode?: string;
  error?: string;
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as
      | string
      | HttpExceptionResponse;

    // 메시지와 에러 코드 추출
    let message: string;
    let errorCode: string;

    if (typeof exceptionResponse === 'object') {
      message = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join(', ')
        : exceptionResponse.message ||
          exceptionResponse.error ||
          '요청 처리 중 오류가 발생했습니다.';
      errorCode = exceptionResponse.errorCode || 'HTTP_ERROR';
    } else {
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : '요청 처리 중 오류가 발생했습니다.';
      errorCode = 'HTTP_ERROR';
    }

    // 에러 정보 구조화
    const errorInfo = {
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      message,
    };

    // 상태 코드에 따른 로깅 레벨 분류
    if (status >= 500) {
      this.logger.error('HTTP 서버 에러', {
        ...errorInfo,
        exception:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : JSON.stringify(exceptionResponse),
        stack: exception.stack,
      });
    } else if (status >= 400) {
      this.logger.warn('HTTP 클라이언트 에러', {
        ...errorInfo,
        exception:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : JSON.stringify(exceptionResponse),
      });
    }

    // 공통 응답 형식 사용
    const errorResponse = new ApiResponseDto(status, message, false, {
      errorCode,
      timestamp: errorInfo.timestamp,
      path: request.url,
      ...(process.env.NODE_ENV !== 'production'
        ? { stack: exception.stack }
        : {}),
    });

    response.status(status).json(errorResponse);
  }
}
