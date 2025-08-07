import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Req,
  Inject,
  Body,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuthService } from './auth.service';
import {
  AuthenticationException,
  InvalidTokenException,
} from '../common/exceptions';
import {
  PhoneVerificationRequest,
  PhoneVerificationConfirmRequest,
  CompleteOnboardingRequest,
} from './types/auth.types';
import { PhoneVerificationResult } from './service/phone.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Public()
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

  @Public()
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

      if ('needsOnboarding' in result) {
        // 온보딩이 필요한 경우
        this.logger.info('카카오 소셜 계정 생성됨 - 온보딩 필요', {
          socialAccountId: result.socialAccountId,
        });

        // 온보딩 페이지로 리다이렉트 (socialAccountId를 쿼리 파라미터로)
        res.redirect(
          `${this.configService.get('FRONTEND_URL')}/onboarding?socialAccountId=${result.socialAccountId}`,
        );
      } else {
        // 기존 사용자 로그인
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
      }
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

  @Public()
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

    // state 값을 세션이나 쿠키에 저장
    // TODO: Redis 사용
    res.cookie('naver_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    res.redirect(`${naverAuthUrl}?${params.toString()}`);
  }

  @Public()
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

      // state 쿠키 제거
      res.clearCookie('naver_state');

      if ('needsOnboarding' in result) {
        // 온보딩이 필요한 경우
        this.logger.info('네이버 소셜 계정 생성됨 - 온보딩 필요', {
          socialAccountId: result.socialAccountId,
        });

        // 온보딩 페이지로 리다이렉트
        res.redirect(
          `${this.configService.get('FRONTEND_URL')}/onboarding?socialAccountId=${result.socialAccountId}`,
        );
      } else {
        // 기존 사용자 로그인
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

        // 프론트엔드로 리다이렉트
        res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
      }
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

  // 전화번호 인증 코드 발송
  @Public()
  @Post('phone/send-code')
  sendVerificationCode(
    @Body() body: PhoneVerificationRequest,
  ): PhoneVerificationResult {
    try {
      const result = this.authService.sendVerificationCode(body.phoneNumber);
      return result;
    } catch (error: unknown) {
      this.logger.error('전화번호 인증 코드 발송 실패', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: body.phoneNumber,
      });
      throw error;
    }
  }

  // 전화번호 인증 및 로그인
  @Public()
  @Post('phone/verify-and-login')
  async verifyPhoneAndLogin(
    @Body() body: PhoneVerificationConfirmRequest,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.verifyPhoneAndLogin(
        body.phoneNumber,
        body.code,
      );

      this.logger.info('전화번호 인증 로그인 성공', {
        userId: result.user.id,
        phoneNumber: body.phoneNumber,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json(result);
    } catch (error: unknown) {
      this.logger.error('전화번호 인증 로그인 실패', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: body.phoneNumber,
      });
      throw error;
    }
  }

  // JWT 인증이 필요한 엔드포인트
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      lastLoginAt: user.lastLoginAt,
      districtVerifiedAt: user.districtVerifiedAt,
    };
  }

  // 토큰 리프레시
  @Public()
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies['refresh_token'] as string | undefined;
      if (!refreshToken) {
        throw new AuthenticationException(
          '리프레시 토큰이 제공되지 않았습니다',
        );
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      // 새 토큰을 쿠키에 설정
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({ success: true });
    } catch (error: unknown) {
      this.logger.error('토큰 리프레시 실패', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new InvalidTokenException('유효하지 않은 리프레시 토큰입니다');
    }
  }

  @Public()
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

  @Public()
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

      if ('needsOnboarding' in result) {
        // 온보딩이 필요한 경우
        this.logger.info('구글 소셜 계정 생성됨 - 온보딩 필요', {
          socialAccountId: result.socialAccountId,
        });

        // 온보딩 페이지로 리다이렉트
        res.redirect(
          `${this.configService.get('FRONTEND_URL')}/onboarding?socialAccountId=${result.socialAccountId}`,
        );
      } else {
        // 기존 사용자 로그인
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
      }
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

  @Post('logout')
  async logout(@CurrentUser() user: User, @Res() res: Response) {
    try {
      await this.authService.logoutUser(user.id);

      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.json({ success: true, message: '로그아웃되었습니다' });
    } catch (error: unknown) {
      this.logger.error('로그아웃 실패', {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // 로그아웃은 실패해도 쿠키는 삭제
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return res.json({ success: true, message: '로그아웃되었습니다' });
    }
  }

  // 온보딩 완료 및 회원가입
  @Public()
  @Post('complete-onboarding')
  async completeOnboarding(
    @Body() body: CompleteOnboardingRequest,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.completeOnboarding(body);

      this.logger.info('온보딩 완료 및 회원가입 성공', {
        userId: result.user.id,
        phoneNumber: body.phoneNumber,
        socialAccountId: body.socialAccountId,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json(result);
    } catch (error: unknown) {
      this.logger.error('온보딩 완료 실패', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: body.phoneNumber,
        socialAccountId: body.socialAccountId,
      });
      throw error;
    }
  }
}
