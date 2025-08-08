import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { KakaoService } from './service/kakao.service';
import { NaverService } from './service/naver.service';
import { GoogleService } from './service/google.service';
import { PhoneService, PhoneVerificationResult } from './service/phone.service';
import {
  LoginResult,
  JwtPayload,
  UserInfo,
  CompleteOnboardingRequest,
  SocialLoginResult,
} from './types';
import {
  User,
  SocialAccount,
  AuthToken,
  UserProfile,
  UserRewards,
  SocialProvider,
  UserStatus,
  Gender,
} from '../entities';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private kakaoService: KakaoService,
    private naverService: NaverService,
    private googleService: GoogleService,
    private phoneService: PhoneService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SocialAccount)
    private socialAccountRepository: Repository<SocialAccount>,
    @InjectRepository(AuthToken)
    private authTokenRepository: Repository<AuthToken>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserRewards)
    private userRewardsRepository: Repository<UserRewards>,
  ) {}

  // 전화번호 인증 코드 발송
  sendVerificationCode(phoneNumber: string): PhoneVerificationResult {
    return this.phoneService.sendVerificationCode(phoneNumber);
  }

  // 전화번호 인증 및 로그인
  async verifyPhoneAndLogin(
    phoneNumber: string,
    code: string,
  ): Promise<LoginResult> {
    const isValid = this.phoneService.verifyCode(phoneNumber, code);

    if (!isValid) {
      throw new BadRequestException('인증에 실패했습니다.');
    }

    const user = await this.phoneService.findOrCreateUser(phoneNumber);
    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        status: user.status,
        onboardingCompleted: !!user.onboardingCompletedAt,
      },
    };
  }

  async kakaoLogin(code: string): Promise<SocialLoginResult> {
    const tokenResponse = await this.kakaoService.getAccessToken(code);
    const userInfo = (await this.kakaoService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    return this.handleSocialLogin(
      SocialProvider.KAKAO,
      String(userInfo.id),
      userInfo.email,
      userInfo.nickname,
      userInfo.profileImage,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
    );
  }

  async naverLogin(code: string, state: string): Promise<SocialLoginResult> {
    const tokenResponse = await this.naverService.getAccessToken(code, state);
    const userInfo = (await this.naverService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    return this.handleSocialLogin(
      SocialProvider.NAVER,
      String(userInfo.id),
      userInfo.email,
      userInfo.nickname,
      userInfo.profileImage,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
    );
  }

  async googleLogin(code: string): Promise<SocialLoginResult> {
    const tokenResponse = await this.googleService.getAccessToken(code);
    const userInfo = (await this.googleService.getUserInfo(
      tokenResponse.access_token,
    )) as UserInfo;

    return this.handleSocialLogin(
      SocialProvider.GOOGLE,
      String(userInfo.id),
      userInfo.email,
      userInfo.nickname,
      userInfo.profileImage,
      tokenResponse.access_token,
      tokenResponse.refresh_token,
    );
  }

  // 소셜 로그인 통합 처리
  private async handleSocialLogin(
    provider: SocialProvider,
    providerId: string,
    email: string,
    nickname: string,
    profileImage: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<SocialLoginResult> {
    // 기존 소셜 계정 확인
    let socialAccount = await this.socialAccountRepository.findOne({
      where: { provider, providerId },
      relations: ['user'],
    });

    if (socialAccount && socialAccount.user) {
      // 이미 회원가입이 완료된 사용자
      const user = socialAccount.user;
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);

      // 소셜 계정 토큰 업데이트
      socialAccount.accessToken = accessToken;
      if (refreshToken) {
        socialAccount.refreshToken = refreshToken;
      }
      socialAccount.email = email;
      socialAccount.profileImageUrl = profileImage;
      await this.socialAccountRepository.save(socialAccount);

      const tokens = await this.generateTokens(user);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          status: user.status,
          onboardingCompleted: !!user.onboardingCompletedAt,
          socialAccounts: [
            {
              provider: socialAccount.provider,
              email: socialAccount.email,
              profileImageUrl: socialAccount.profileImageUrl,
            },
          ],
        },
      };
    } else {
      // 새로운 소셜 계정 - User는 생성하지 않고 SocialAccount만 저장
      if (socialAccount) {
        // 소셜 계정 정보 업데이트
        socialAccount.accessToken = accessToken;
        if (refreshToken) {
          socialAccount.refreshToken = refreshToken;
        }
        socialAccount.email = email;
        socialAccount.profileImageUrl = profileImage;
        await this.socialAccountRepository.save(socialAccount);
      } else {
        // 새 소셜 계정 생성 (userId는 null)
        socialAccount = this.socialAccountRepository.create({
          userId: null,
          provider,
          providerId,
          email,
          profileImageUrl: profileImage,
          accessToken,
          refreshToken,
        });
        await this.socialAccountRepository.save(socialAccount);
      }

      // 온보딩이 필요한 소셜 계정 정보 반환
      return {
        socialAccountId: socialAccount.id,
        needsOnboarding: true,
        socialAccount: {
          provider: socialAccount.provider,
          email: socialAccount.email,
          profileImageUrl: socialAccount.profileImageUrl,
        },
      };
    }
  }

  // 기본 사용자 데이터 생성
  private async createDefaultUserData(
    userId: string,
    nickname: string,
    profileImage: string,
  ) {
    // UserProfile 생성 (기본값으로)
    const profile = this.userProfileRepository.create({
      userId,
      nickname: nickname || '사용자',
      profileImageUrl: profileImage || '',
      categoryIds: [],
      birthYear: new Date().getFullYear() - 25, // 기본 25세
      gender: Gender.MALE, // 기본값
      districtId: '', // 온보딩에서 설정
      points: 0,
      level: 1,
    });
    await this.userProfileRepository.save(profile);

    // UserRewards 생성
    const rewards = this.userRewardsRepository.create({
      userId,
      aiMissionTickets: 0,
    });
    await this.userRewardsRepository.save(rewards);
  }

  // JWT 토큰 생성 및 DB 저장
  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber || undefined,
    };

    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '1h';
    const refreshTokenExpiresIn =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: refreshTokenExpiresIn },
    );

    // 만료 시간 계산 (밀리초로 변환)
    const accessExpiresAt = new Date(
      Date.now() + this.parseTimeToMs(accessTokenExpiresIn),
    );
    const refreshExpiresAt = new Date(
      Date.now() + this.parseTimeToMs(refreshTokenExpiresIn),
    );

    // AuthToken 테이블에 저장
    const authToken = this.authTokenRepository.create({
      userId: user.id,
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
    });
    await this.authTokenRepository.save(authToken);

    return { accessToken, refreshToken };
  }

  // 시간 문자열을 밀리초로 변환 (1h -> 3600000, 7d -> 604800000)
  private parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1000, // 초
      m: 60 * 1000, // 분
      h: 60 * 60 * 1000, // 시간
      d: 24 * 60 * 60 * 1000, // 일
      w: 7 * 24 * 60 * 60 * 1000, // 주
    };

    return value * multipliers[unit as keyof typeof multipliers];
  }

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // 토큰이 revoked되었는지 확인
      const authToken = await this.authTokenRepository.findOne({
        where: { accessToken: token, isRevoked: false },
      });

      if (!authToken) {
        throw new Error('Token not found or revoked');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['profile', 'socialAccounts'],
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        status: user.status,
        onboardingCompleted: !!user.onboardingCompletedAt,
      };
    } catch {
      throw new Error('Invalid token');
    }
  }

  // 리프레시 토큰으로 새 액세스 토큰 발급
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      const authToken = await this.authTokenRepository.findOne({
        where: { refreshToken, isRevoked: false },
      });

      if (!authToken || authToken.refreshExpiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 새 토큰 생성
      const newTokens = await this.generateTokens(user);

      // 기존 토큰 무효화
      authToken.isRevoked = true;
      await this.authTokenRepository.save(authToken);

      return newTokens;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  // 로그아웃 (토큰으로)
  async logout(token: string) {
    const authToken = await this.authTokenRepository.findOne({
      where: { accessToken: token },
    });

    if (authToken) {
      authToken.isRevoked = true;
      await this.authTokenRepository.save(authToken);
    }
  }

  // 로그아웃 (사용자 ID로)
  async logoutUser(userId: string) {
    await this.authTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  // 온보딩 완료 및 회원가입
  async completeOnboarding(
    request: CompleteOnboardingRequest,
  ): Promise<LoginResult> {
    const {
      socialAccountId,
      phoneNumber,
      nickname,
      birthYear,
      gender,
      districtId,
      categoryIds,
    } = request;

    // 소셜 계정 확인
    const socialAccount = await this.socialAccountRepository.findOne({
      where: { id: socialAccountId },
    });

    if (!socialAccount) {
      throw new BadRequestException('유효하지 않은 소셜 계정입니다.');
    }

    if (socialAccount.userId) {
      throw new BadRequestException('이미 회원가입이 완료된 계정입니다.');
    }

    // 전화번호 중복 확인
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 전화번호입니다.');
    }

    // User 생성
    const user = this.userRepository.create({
      phoneNumber,
      status: UserStatus.ACTIVE,
      lastLoginAt: new Date(),
      onboardingCompletedAt: new Date(),
      phoneVerifiedAt: new Date(), // 온보딩 완료 시 전화번호도 인증된 것으로 간주
    });
    await this.userRepository.save(user);

    // SocialAccount와 User 연결
    socialAccount.userId = user.id;
    await this.socialAccountRepository.save(socialAccount);

    // UserProfile 생성
    const profile = this.userProfileRepository.create({
      userId: user.id,
      nickname,
      profileImageUrl: socialAccount.profileImageUrl || '',
      categoryIds: categoryIds.map((id) => parseInt(id, 10)),
      birthYear,
      gender: gender as Gender,
      districtId,
      points: 0,
      level: 1,
    });
    await this.userProfileRepository.save(profile);

    // UserRewards 생성
    const rewards = this.userRewardsRepository.create({
      userId: user.id,
      aiMissionTickets: 0,
    });
    await this.userRewardsRepository.save(rewards);

    // 토큰 생성
    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        status: user.status,
        onboardingCompleted: true,
        socialAccounts: [
          {
            provider: socialAccount.provider,
            email: socialAccount.email,
            profileImageUrl: socialAccount.profileImageUrl,
          },
        ],
      },
    };
  }
}
