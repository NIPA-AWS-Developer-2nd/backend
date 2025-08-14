import { IsNumber, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyLocationDto {
  @ApiProperty({
    description: '사용자 현재 위치 위도',
    example: 37.5172,
  })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: '사용자 현재 위치 경도',
    example: 127.0473,
  })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: '인증하려는 지역 ID',
    example: '01HQXXX...',
  })
  @IsString()
  @IsNotEmpty()
  districtId: string;
}

export class LocationVerificationResponseDto {
  @ApiProperty({
    description: '인증 성공 여부',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: '지역 정보',
    example: {
      id: '01HQXXX...',
      districtName: '강남구',
      city: '서울특별시',
    },
  })
  district: {
    id: string;
    districtName: string;
    city: string;
  };

  @ApiProperty({
    description: '거리 정보 (미터)',
    example: 1500,
    required: false,
  })
  distance?: number;

  @ApiProperty({
    description: '오류 메시지',
    example: '현재 위치가 강남구에서 2.5km 떨어져 있습니다.',
    required: false,
  })
  message?: string;
}
