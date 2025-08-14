import { Gender } from '../../../entities';

export interface CompleteUserInfo {
  id: string;
  phoneNumber: string | null;
  status: string;
  phoneVerifiedAt: Date | null;
  onboardingCompletedAt: Date | null;
  lastLoginAt: Date | null;
  lastLocationVerificationAt: Date | null;
  currentDistrict: {
    id: string;
    districtName: string;
    city: string;
  } | null;
  profile: {
    nickname: string;
    profileImageUrl: string;
    bio: string | null;
    birthYear: number | null;
    gender: Gender | null;
    mbti: string | null;
    interests: string[];
    hashtags: string[];
    points: number;
    level: number; // 동적으로 계산됨
    district: {
      id: string;
      name: string;
      city: string;
    } | null;
  } | null;
  socialAccounts: {
    provider: string;
    email: string | null;
    profileImageUrl: string | null;
  }[];
}
