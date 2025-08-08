import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { GoogleTokenResponse, GoogleUserInfo } from '../types';

@Injectable()
export class GoogleService {
  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getAccessToken(code: string): Promise<GoogleTokenResponse> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      client_id: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      client_secret:
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI') || '',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('구글 토큰 요청 에러', { errorText });
        throw new UnauthorizedException('구글 토큰 요청 실패');
      }

      const data = (await response.json()) as GoogleTokenResponse;

      return {
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
      };
    } catch (error: unknown) {
      this.logger.error('구글 토큰 예외 발생', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new UnauthorizedException('구글 토큰을 가져올 수 없습니다.');
    }
  }

  async getUserInfo(accessToken: string) {
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';

    try {
      const response = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('구글 사용자 정보 요청 에러', {
          errorText,
          accessToken: accessToken.substring(0, 10) + '...',
        });
        throw new UnauthorizedException('구글 사용자 정보 요청 실패');
      }

      const data = (await response.json()) as GoogleUserInfo;

      return {
        id: data.id,
        email: data.email,
        nickname: data.name || data.email?.split('@')[0] || 'Google User',
        profileImage: data.picture || '',
      };
    } catch (error: unknown) {
      this.logger.error('구글 사용자 정보 예외 발생', {
        error: error instanceof Error ? error.message : String(error),
        accessToken: accessToken.substring(0, 10) + '...',
      });
      throw new UnauthorizedException('구글 사용자 정보를 가져올 수 없습니다.');
    }
  }
}
