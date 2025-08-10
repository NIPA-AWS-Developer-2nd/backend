import {
  IsString,
  IsInt,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Gender } from '../../../entities';

export class OnboardingProfileDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @IsString()
  @IsNotEmpty()
  profileImageUrl: string;

  @IsArray()
  @IsInt({ each: true })
  categoryIds: number[]; // 프론트엔드 호환성을 위해 categoryIds로 받고 내부적으로 interestIds로 처리

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  hashtagIds?: number[];

  @IsString()
  @IsOptional()
  mbti?: string;

  @IsString()
  @IsNotEmpty()
  districtId: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  birthYear: number;

  @IsEnum(Gender)
  gender: Gender;
}

export class OnboardingCompleteDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  profile: OnboardingProfileDto;
}
