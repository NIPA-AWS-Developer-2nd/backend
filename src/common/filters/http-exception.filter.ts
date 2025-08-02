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
    const exceptionResponse = exception.getResponse();

    // 에러 정보 구조화
    const errorInfo = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
    };

    // 상태 코드에 따른 로깅 레벨 분류
    if (status >= 500) {
      this.logger.error('HTTP 서버 에러', {
        ...errorInfo,
        exception: exceptionResponse,
        stack: exception.stack,
      });
    } else if (status >= 400) {
      this.logger.warn('HTTP 클라이언트 에러', {
        ...errorInfo,
        exception: exceptionResponse,
      });
    }

    // 클라이언트에게 반환할 응답 구성
    const errorResponse = {
      statusCode: status,
      timestamp: errorInfo.timestamp,
      path: request.url,
      ...(typeof exceptionResponse === 'object'
        ? exceptionResponse
        : { message: exceptionResponse }),
    };

    response.status(status).json(errorResponse);
  }
}
