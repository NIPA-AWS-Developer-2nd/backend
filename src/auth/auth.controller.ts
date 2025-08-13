import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Req,
  Inject,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { TIME_MULTIPLIERS } from '../common/constants/time.constants';
import {
  AuthenticationException,
  InvalidTokenException,
  DevTokenProductionException,
  DevTokenGenerationException,
} from '../common/exceptions';
import { SocialLoginResult, LoginResult } from './types';
import {
  PhoneVerificationRequest,
  PhoneVerificationConfirmRequest,
  CompleteOnboardingRequest,
} from './types/auth.types';
import { PhoneVerificationResult } from './service/phone.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User, UserProfile } from '../entities';
import { UserStatus } from '../entities/user.entity';

// 개발용 토큰 발급 DTO
class DevTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  nickname: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
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
      const result: SocialLoginResult = await this.authService.kakaoLogin(code);

      this.logger.info('카카오 로그인 성공', {
        userId: (result.user as { id: string; onboardingCompleted: boolean })
          .id,
        onboardingCompleted: (
          result.user as { id: string; onboardingCompleted: boolean }
        ).onboardingCompleted,
      });

      // JWT 토큰 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d,
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d,
      });

      // 온보딩 완료 여부에 따라 리다이렉트
      if (
        (result.user as { onboardingCompleted: boolean }).onboardingCompleted
      ) {
        // 온보딩 완료된 사용자는 홈으로
        res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
      } else {
        // 온보딩 미완료 사용자는 온보딩 페이지로
        res.redirect(`${this.configService.get('FRONTEND_URL')}/onboarding`);
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
      maxAge: 10 * TIME_MULTIPLIERS.m,
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
      const result: SocialLoginResult = await this.authService.naverLogin(
        code,
        state,
      );

      // state 쿠키 제거
      res.clearCookie('naver_state');

      this.logger.info('네이버 로그인 성공', {
        userId: (result.user as { id: string; onboardingCompleted: boolean })
          .id,
        onboardingCompleted: (
          result.user as { id: string; onboardingCompleted: boolean }
        ).onboardingCompleted,
      });

      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d, // 7 days
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d, // 7 days
      });

      if (
        (result.user as { onboardingCompleted: boolean }).onboardingCompleted
      ) {
        res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
      } else {
        res.redirect(`${this.configService.get('FRONTEND_URL')}/onboarding`);
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

  // 전화번호 인증
  @Post('phone/verify')
  async verifyPhoneAndLogin(
    @Body() body: PhoneVerificationConfirmRequest,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    try {
      const result: LoginResult = await this.authService.verifyPhoneAndLogin(
        body.phoneNumber,
        body.code,
        user.id, // 현재 사용자 ID 전달
      );

      this.logger.info('전화번호 인증 성공', {
        userId: result.user.id,
        phoneNumber: body.phoneNumber,
        merged: !!result.merged, // 통합 여부 로그
      });

      // 계정이 통합되었다면 새로운 토큰으로 쿠키 업데이트
      if (result.merged) {
        res.cookie('access_token', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: TIME_MULTIPLIERS.h,
        });

        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * TIME_MULTIPLIERS.d,
        });
      }

      return res.json(result);
    } catch (error: unknown) {
      this.logger.error('전화번호 인증 실패', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: body.phoneNumber,
      });
      throw error;
    }
  }

  @Get('me')
  getMe(@CurrentUser() user: User) {
    const response = {
      id: user.id,
      phoneNumber: user.phoneNumber,
      status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      lastLoginAt: user.lastLoginAt,
      districtVerifiedAt: user.districtVerifiedAt,
    };

    return response;
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      this.logger.info('토큰 리프레시 요청 시작');

      const refreshToken = req.cookies['refresh_token'] as string | undefined;
      if (!refreshToken) {
        this.logger.warn('리프레시 토큰이 쿠키에 없음');
        throw new AuthenticationException(
          '리프레시 토큰이 제공되지 않았습니다',
        );
      }

      this.logger.info('리프레시 토큰 검증 중');
      const tokens = await this.authService.refreshAccessToken(refreshToken);

      this.logger.info('새 토큰 발급 완료, 쿠키 설정 중');

      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TIME_MULTIPLIERS.h,
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d,
      });

      this.logger.info('토큰 리프레시 완료');
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
      const result: SocialLoginResult =
        await this.authService.googleLogin(code);

      this.logger.info('구글 로그인 성공', {
        userId: (result.user as { id: string; onboardingCompleted: boolean })
          .id,
        onboardingCompleted: (
          result.user as { id: string; onboardingCompleted: boolean }
        ).onboardingCompleted,
      });

      // JWT 토큰을 쿠키에 설정
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d, // 7 days
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d, // 7 days
      });

      if (
        (result.user as { onboardingCompleted: boolean }).onboardingCompleted
      ) {
        res.redirect(`${this.configService.get('FRONTEND_URL')}/auth/success`);
      } else {
        res.redirect(`${this.configService.get('FRONTEND_URL')}/onboarding`);
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
  @Post('complete-onboarding')
  async completeOnboarding(
    @CurrentUser() user: User,
    @Body() body: CompleteOnboardingRequest,
    @Res() res: Response,
  ) {
    try {
      const result: LoginResult = await this.authService.completeOnboarding(
        user.id,
        body,
      );

      this.logger.info('온보딩 완료 및 회원가입 성공', {
        userId: result.user.id,
        phoneNumber: body.phoneNumber,
      });

      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TIME_MULTIPLIERS.h,
      });

      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * TIME_MULTIPLIERS.d,
      });

      return res.json(result);
    } catch (error: unknown) {
      this.logger.error('온보딩 처리 실패', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumber: body.phoneNumber,
        userId: user.id,
      });
      throw error;
    }
  }

  // 개발용 토큰 발급 API (프로덕션 환경에서는 비활성화)
  @Public()
  @Post('dev-token')
  @ApiOperation({
    summary: '개발용 토큰 발급',
    description:
      '닉네임으로 사용자를 찾아서 해당 사용자의 토큰을 발급합니다. 개발 환경에서만 사용 가능합니다.',
  })
  @ApiBody({
    description: '토큰을 발급받을 사용자의 닉네임',
    type: DevTokenRequestDto,
    examples: {
      example1: {
        summary: '닉네임 예시',
        value: { nickname: '테스트계정' },
      },
    },
  })
  @ApiResponse({
    status: 302,
    description:
      '토큰 발급 성공 후 리다이렉트 - 온보딩 완료 시 /auth/success, 미완료 시 /onboarding',
  })
  @ApiResponse({
    status: 400,
    description: '프로덕션 환경에서는 사용할 수 없습니다',
  })
  @ApiResponse({
    status: 404,
    description: '해당 닉네임의 사용자를 찾을 수 없습니다',
  })
  async generateDevToken(
    @Body() body: DevTokenRequestDto,
    @Res() res: Response,
  ) {
    // 프로덕션 환경에서는 비활성화
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('프로덕션 환경에서 개발용 토큰 발급 시도', {
        nickname: body.nickname,
        userAgent: res.req.get('User-Agent'),
        ip: res.req.ip,
      });
      throw new DevTokenProductionException();
    }

    if (!body.nickname || body.nickname.trim() === '') {
      this.logger.warn('개발용 토큰 발급 - 빈 닉네임', {
        nickname: body.nickname,
      });
      throw new BadRequestException('닉네임은 필수입니다.');
    }

    try {
      this.logger.info('개발용 토큰 발급 시도', {
        nickname: body.nickname,
        userAgent: res.req.get('User-Agent'),
        ip: res.req.ip,
      });

      // 닉네임으로 사용자 찾기
      const userProfile = await this.userProfileRepository.findOne({
        where: { nickname: body.nickname.trim() },
        relations: ['user'],
      });

      if (!userProfile || !userProfile.user) {
        this.logger.warn('개발용 토큰 발급 - 사용자 없음', {
          nickname: body.nickname,
        });
        throw new NotFoundException(
          `닉네임 '${body.nickname}'인 사용자를 찾을 수 없습니다.`,
        );
      }

      const user = userProfile.user;

      // 사용자 계정 상태 확인
      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn('개발용 토큰 발급 - 비활성 계정', {
          userId: user.id,
          nickname: body.nickname,
          status: user.status,
        });
        throw new BadRequestException(
          `해당 사용자의 계정이 활성화되지 않았습니다. (상태: ${user.status})`,
        );
      }

      // 해당 사용자의 토큰 생성
      const tokens = await this.authService.generateTokens(user);

      this.logger.info('개발용 토큰 발급 성공', {
        userId: user.id,
        nickname: body.nickname,
        onboardingCompleted: !!user.onboardingCompletedAt,
      });

      // 쿠키 설정
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 7 * TIME_MULTIPLIERS.d,
      };

      res.cookie('access_token', tokens.accessToken, cookieOptions);
      res.cookie('refresh_token', tokens.refreshToken, cookieOptions);

      // 온보딩 완료 여부에 따라 리다이렉트
      const redirectUrl = user.onboardingCompletedAt
        ? `${this.configService.get('FRONTEND_URL')}/auth/success`
        : `${this.configService.get('FRONTEND_URL')}/onboarding`;

      res.redirect(redirectUrl);
    } catch (error: unknown) {
      // 이미 처리된 HTTP 예외는 그대로 던지기
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof DevTokenProductionException
      ) {
        throw error;
      }

      // 예상치 못한 에러 로깅 및 처리
      this.logger.error('개발용 토큰 발급 중 예상치 못한 오류', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        nickname: body.nickname,
      });

      throw new DevTokenGenerationException();
    }
  }
}
