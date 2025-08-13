import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiResponseDto } from '../dto/api-response.dto';
import { ErrorCode } from '../types/common.types';

interface HttpExceptionResponse {
  message?: string | string[];
  errorCode?: string;
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorCode: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as
        | string
        | HttpExceptionResponse;

      if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : exceptionResponse.message;
        errorCode =
          exceptionResponse.errorCode || this.getDefaultErrorCode(status);
      } else {
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : '요청 처리 중 오류가 발생했습니다.';
        errorCode = this.getDefaultErrorCode(status);
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '서버 내부 오류가 발생했습니다.';
      errorCode = ErrorCode.SYSTEM_INTERNAL_ERROR;
    }

    // 에러 로깅
    const errorLog = {
      errorCode,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      stack: exception instanceof Error ? exception.stack : undefined,
      // 요청 본문이 있다면 로깅 (민감한 정보 제외)
      ...(request.body &&
      typeof request.body === 'object' &&
      Object.keys(request.body as Record<string, unknown>).length > 0
        ? {
            requestBody: this.sanitizeRequestBody(
              request.body as Record<string, unknown>,
            ),
          }
        : {}),
    };

    if (status >= 500) {
      this.logger.error('서버 에러 발생', errorLog);
    } else if (status >= 400) {
      this.logger.warn('클라이언트 에러 발생', errorLog);
    }

    // 공통 응답 형식 사용
    const errorResponse = new ApiResponseDto(status, message, false, {
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });

    response.status(status).json(errorResponse);
  }

  private getDefaultErrorCode(status: number): string {
    switch (status) {
      case 400: // HttpStatus.BAD_REQUEST
        return ErrorCode.VALIDATION_FAILED;
      case 401: // HttpStatus.UNAUTHORIZED
        return ErrorCode.AUTH_UNAUTHORIZED;
      case 403: // HttpStatus.FORBIDDEN
        return ErrorCode.AUTH_UNAUTHORIZED;
      case 404: // HttpStatus.NOT_FOUND
        return ErrorCode.USER_NOT_FOUND;
      case 409: // HttpStatus.CONFLICT
        return ErrorCode.USER_ALREADY_EXISTS;
      case 422: // HttpStatus.UNPROCESSABLE_ENTITY
        return ErrorCode.VALIDATION_FAILED;
      case 500: // HttpStatus.INTERNAL_SERVER_ERROR
        return ErrorCode.SYSTEM_INTERNAL_ERROR;
      case 502: // HttpStatus.BAD_GATEWAY
        return ErrorCode.SYSTEM_EXTERNAL_API_ERROR;
      case 503: // HttpStatus.SERVICE_UNAVAILABLE
        return ErrorCode.SYSTEM_EXTERNAL_API_ERROR;
      case 504: // HttpStatus.GATEWAY_TIMEOUT
        return ErrorCode.SYSTEM_EXTERNAL_API_ERROR;
      default:
        return ErrorCode.SYSTEM_INTERNAL_ERROR;
    }
  }

  // 민감한 정보를 제거하는 메서드
  private sanitizeRequestBody(
    body: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'auth',
      'credential',
    ];

    const sanitized: Record<string, unknown> = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
