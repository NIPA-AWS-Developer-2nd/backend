import { Controller, Get, Query, Res, Req, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuthService } from './auth.service';
import {
  AuthenticationException,
  InvalidTokenException,
} from '../common/exceptions';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('kakao')
  kakaoAuth(@Res() res: Response) {
    const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.configService.get('KAKAO_CLIENT_ID') || '',
      redirect_uri: this.configService.get('KAKAO_REDIRECT_URI') || '',
      response_type: 'code',
      scope: 'profile_nickname,profile_image,account_email',
    });

    res.redirect(`${kakaoAuthUrl}?${params.toString()}`);
  }

  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      this.logger.warn('카카오 인증 실패', { error, code });
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=kakao_auth_failed`,
      );
    }

    try {
      const result = await this.authService.kakaoLogin(code);
      this.logger.info('카카오 로그인 성공', {
        userId: result.user.id,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 프론트엔드로 리다이렉트
      res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
    } catch (error: unknown) {
      this.logger.error('카카오 로그인 실패', {
        error: error instanceof Error ? error.message : String(error),
        code,
      });
      res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=kakao_login_failed`,
      );
    }
  }

  @Get('naver')
  naverAuth(@Res() res: Response) {
    const state = Math.random().toString(36).substring(2, 15);
    const naverAuthUrl = 'https://nid.naver.com/oauth2.0/authorize';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.configService.get('NAVER_CLIENT_ID') || '',
      redirect_uri: this.configService.get('NAVER_REDIRECT_URI') || '',
      state,
    });

    // state 값을 세션이나 쿠키에 저장 (실제 구현에서는 Redis 등 사용 권장)
    res.cookie('naver_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.redirect(`${naverAuthUrl}?${params.toString()}`);
  }

  @Get('naver/callback')
  async naverCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code || !state) {
      this.logger.warn('네이버 인증 실패', { error, code, state });
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=naver_auth_failed`,
      );
    }

    try {
      const result = await this.authService.naverLogin(code, state);
      this.logger.info('네이버 로그인 성공', {
        userId: result.user.id,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // state 쿠키 제거
      res.clearCookie('naver_state');

      // 프론트엔드로 리다이렉트
      res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
    } catch (error: unknown) {
      this.logger.error('네이버 로그인 실패', {
        error: error instanceof Error ? error.message : String(error),
        code,
        state,
      });
      res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=naver_login_failed`,
      );
    }
  }

  @Get('me')
  getMe(@Req() req: Request) {
    try {
      const token = req.cookies['access_token'] as string | undefined;
      if (!token) {
        throw new AuthenticationException('토큰이 제공되지 않았습니다');
      }

      return this.authService.getUserFromToken(token);
    } catch {
      throw new InvalidTokenException('유효하지 않은 토큰입니다');
    }
  }

  @Get('google')
  googleAuth(@Res() res: Response) {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: this.configService.get('GOOGLE_CLIENT_ID') || '',
      redirect_uri: this.configService.get('GOOGLE_REDIRECT_URI') || '',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    res.redirect(`${googleAuthUrl}?${params.toString()}`);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error || !code) {
      this.logger.warn('구글 인증 실패', { error, code });
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=google_auth_failed`,
      );
    }

    try {
      const result = await this.authService.googleLogin(code);
      this.logger.info('구글 로그인 성공', {
        userId: result.user.id,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 프론트엔드로 리다이렉트
      res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
    } catch (error: unknown) {
      this.logger.error('구글 로그인 실패', {
        error: error instanceof Error ? error.message : String(error),
        code,
      });
      res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=google_login_failed`,
      );
    }
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.redirect(`${this.configService.get('FRONTEND_URL')}/login`);
  }
}
