import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios from 'axios';
import { KakaoTokenResponse, KakaoUserResponse } from '../types';

@Injectable()
export class KakaoService {
  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getAccessToken(code: string): Promise<KakaoTokenResponse> {
    try {
      const response = await axios.post<KakaoTokenResponse>(
        'https://kauth.kakao.com/oauth/token',
        {
          grant_type: 'authorization_code',
          client_id: this.configService.get<string>('KAKAO_CLIENT_ID') || '',
          client_secret:
            this.configService.get<string>('KAKAO_CLIENT_SECRET') || '',
          redirect_uri:
            this.configService.get<string>('KAKAO_REDIRECT_URI') || '',
          code,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error('카카오 토큰 교환 에러', {
          error: error.message,
          responseData: error.response?.data as unknown,
          status: error.response?.status,
        });
      } else {
        this.logger.error('카카오 토큰 교환 에러', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      throw new UnauthorizedException('카카오 토큰을 가져올 수 없습니다.');
    }
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get<KakaoUserResponse>(
        'https://kapi.kakao.com/v2/user/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const kakaoAccount = response.data.kakao_account;
      const profile = kakaoAccount?.profile;

      return {
        id: String(response.data.id),
        email: kakaoAccount?.email || '',
        nickname: profile?.nickname || 'Kakao User',
        profileImage: profile?.profile_image_url || '',
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error('카카오 API 에러', {
          error: error.message,
          responseData: error.response?.data as unknown,
          status: error.response?.status,
        });
      } else {
        this.logger.error('카카오 API 에러', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      throw new UnauthorizedException(
        '카카오 사용자 정보를 가져올 수 없습니다.',
      );
    }
  }
}
