import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NaverTokenResponse, NaverUserResponse } from '../types';

@Injectable()
export class NaverService {
  constructor(private configService: ConfigService) {}

  async getAccessToken(
    code: string,
    state: string,
  ): Promise<NaverTokenResponse> {
    try {
      const response = await axios.post<NaverTokenResponse>(
        'https://nid.naver.com/oauth2.0/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            client_id: this.configService.get<string>('NAVER_CLIENT_ID'),
            client_secret: this.configService.get<string>(
              'NAVER_CLIENT_SECRET',
            ),
            redirect_uri: this.configService.get<string>('NAVER_REDIRECT_URI'),
            code,
            state,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('네이버 토큰 교환 에러:', error);
      throw new UnauthorizedException('네이버 토큰을 가져올 수 없습니다.');
    }
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get<NaverUserResponse>(
        'https://openapi.naver.com/v1/nid/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const user = response.data.response;

      return {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profile_image,
      };
    } catch {
      throw new UnauthorizedException(
        '네이버 사용자 정보를 가져올 수 없습니다.',
      );
    }
  }
}
