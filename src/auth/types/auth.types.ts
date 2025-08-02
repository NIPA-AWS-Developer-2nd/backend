export interface UserInfo {
  id: string | number;
  email: string;
  nickname: string;
  profileImage: string;
  provider?: 'kakao' | 'naver' | 'google';
}

export interface LoginResult {
  accessToken: string;
  user: UserInfo & { provider: 'kakao' | 'naver' | 'google' };
}

export interface JwtPayload {
  sub: string | number;
  email: string;
  nickname: string;
  provider: 'kakao' | 'naver' | 'google';
  iat?: number;
  exp?: number;
}
