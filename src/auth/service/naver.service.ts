import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios from 'axios';
import { NaverTokenResponse, NaverUserResponse } from '../types';

@Injectable()
export class NaverService {
  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error('네이버 토큰 교환 에러', {
          error: error.message,
          response: error.response?.data as unknown,
          code,
          state,
        });
      } else {
        this.logger.error('네이버 토큰 교환 에러', {
          error: error instanceof Error ? error.message : String(error),
          code,
          state,
        });
      }
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
