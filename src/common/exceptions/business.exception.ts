import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode = HttpStatus.BAD_REQUEST) {
    super(
      {
        error: 'Business Logic Error',
        message,
        statusCode,
      },
      statusCode,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string | string[], field?: string) {
    super(
      {
        error: 'Validation Error',
        message,
        field,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource}(ID: ${id})을(를) 찾을 수 없습니다`
      : `${resource}을(를) 찾을 수 없습니다`;

    super(
      {
        error: 'Resource Not Found',
        message,
        resource,
        id,
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string) {
    const message = field
      ? `${resource}의 ${field}이(가) 이미 존재합니다`
      : `${resource}이(가) 이미 존재합니다`;

    super(
      {
        error: 'Duplicate Resource',
        message,
        resource,
        field,
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  }
}
