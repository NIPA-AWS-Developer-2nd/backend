import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { KakaoService } from './service/kakao.service';
import { NaverService } from './service/naver.service';
import { GoogleService } from './service/google.service';
import { LoginResult, JwtPayload, UserInfo } from './types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private kakaoService: KakaoService,
    private naverService: NaverService,
    private googleService: GoogleService,
  ) {}

  async kakaoLogin(code: string): Promise<LoginResult> {
    const tokenResponse = await this.kakaoService.getAccessToken(code);

    const userInfo = (await this.kakaoService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    const payload: JwtPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      nickname: userInfo.nickname,
      provider: 'kakao',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        ...userInfo,
        provider: 'kakao' as const,
      },
    };
  }

  async naverLogin(code: string, state: string): Promise<LoginResult> {
    const tokenResponse = await this.naverService.getAccessToken(code, state);

    const userInfo = (await this.naverService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    const payload: JwtPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      nickname: userInfo.nickname,
      provider: 'naver',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        ...userInfo,
        provider: 'naver' as const,
      },
    };
  }

  async googleLogin(code: string): Promise<LoginResult> {
    const tokenResponse = await this.googleService.getAccessToken(code);

    const userInfo = (await this.googleService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    const payload: JwtPayload = {
      sub: userInfo.id,
      email: userInfo.email,
      nickname: userInfo.nickname,
      provider: 'google',
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        ...userInfo,
        provider: 'google' as const,
      },
    };
  }

  getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      return {
        id: payload.sub,
        email: payload.email,
        nickname: payload.nickname,
        provider: payload.provider,
      };
    } catch {
      throw new Error('Invalid token');
    }
  }
}
