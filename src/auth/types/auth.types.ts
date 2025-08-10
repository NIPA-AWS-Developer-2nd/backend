export interface UserInfo {
  id: string | number;
  email: string;
  nickname: string;
  profileImage: string;
  provider?: 'kakao' | 'naver' | 'google';
}

export interface SocialAccountInfo {
  provider: 'kakao' | 'naver' | 'google';
  email?: string;
  profileImageUrl?: string;
}

export interface LoginUser {
  id: string;
  phoneNumber?: string | null;
  status: string;
  onboardingCompleted: boolean;
  socialAccounts?: SocialAccountInfo[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
  merged?: boolean; // 계정 통합 여부
}

export interface JwtPayload {
  sub: string;
  phoneNumber?: string | null;
  iat?: number;
  exp?: number;
}

export interface PhoneVerificationRequest {
  phoneNumber: string;
}

export interface PhoneVerificationConfirmRequest {
  phoneNumber: string;
  code: string;
}

export interface CompleteOnboardingRequest {
  phoneNumber: string;
  nickname: string;
  birthYear: number;
  gender: string;
  districtId: string;
  interestIds?: number[];
  hashtagIds?: number[];
  mbti?: string;
  profileImageUrl?: string;
}

export type SocialLoginResult = LoginResult;
