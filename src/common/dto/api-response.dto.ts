import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'HTTP 상태 코드' })
  status: number;

  @ApiProperty({ description: '응답 메시지' })
  message: string;

  @ApiProperty({ description: '요청 성공 여부' })
  result: boolean;

  @ApiProperty({ description: '응답 데이터' })
  data?: T;

  constructor(status: number, message: string, result: boolean, data?: T) {
    this.status = status;
    this.message = message;
    this.result = result;
    this.data = data;
  }

  // 성공 응답 생성
  static success<T>(data: T, message = '성공'): ApiResponseDto<T> {
    return new ApiResponseDto(200, message, true, data);
  }

  static created<T>(data: T, message = '생성 완료'): ApiResponseDto<T> {
    return new ApiResponseDto(201, message, true, data);
  }

  // 실패 응답 생성
  static fail(status: number, message: string): ApiResponseDto<null> {
    return new ApiResponseDto(status, message, false);
  }
}

// 페이지네이션 응답
export class PagedResponseDto<T> {
  @ApiProperty({ description: '현재 페이지' })
  page: number;

  @ApiProperty({ description: '페이지 크기' })
  size: number;

  @ApiProperty({ description: '전체 항목 수' })
  totalElements: number;

  @ApiProperty({ description: '전체 페이지 수' })
  totalPages: number;

  @ApiProperty({ description: '데이터 목록' })
  data: T[];

  constructor(page: number, size: number, totalElements: number, data: T[]) {
    this.page = page;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = Math.ceil(totalElements / size);
    this.data = data;
  }
}
