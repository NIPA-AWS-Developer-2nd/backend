import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsIn, Length, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    description: '닉네임',
    example: '홍길동',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  nickname?: string;

  @ApiProperty({
    description: '자기소개',
    example: '안녕하세요, 저는 운동을 좋아하는 사람입니다.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  bio?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://cdn.halsaram.com/profiles/01HQXXX.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiProperty({
    description: '사용자 관심사 ID 목록',
    example: [1, 3, 5],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userInterestIds?: number[];

  @ApiProperty({
    description: '사용자 해시태그 ID 목록',
    example: [2, 4, 6],
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  userHashtagIds?: number[];

  @ApiProperty({
    description: 'MBTI 유형',
    example: 'ENFP',
    required: false,
    enum: [
      'INTJ',
      'INTP',
      'ENTJ',
      'ENTP',
      'INFJ',
      'INFP',
      'ENFJ',
      'ENFP',
      'ISTJ',
      'ISFJ',
      'ESTJ',
      'ESFJ',
      'ISTP',
      'ISFP',
      'ESTP',
      'ESFP',
    ],
  })
  @IsOptional()
  @IsString()
  @IsIn([
    'INTJ',
    'INTP',
    'ENTJ',
    'ENTP',
    'INFJ',
    'INFP',
    'ENFJ',
    'ENFP',
    'ISTJ',
    'ISFJ',
    'ESTJ',
    'ESFJ',
    'ISTP',
    'ISFP',
    'ESTP',
    'ESFP',
  ])
  mbti?: string;

  @ApiProperty({
    description: '활동 지역 ID',
    example: '01HQXXX',
    required: false,
  })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiProperty({
    description: '출생연도',
    example: 1990,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  birthYear?: number;

  @ApiProperty({
    description: '성별',
    example: 'male',
    required: false,
    enum: ['male', 'female'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  gender?: string;
}
