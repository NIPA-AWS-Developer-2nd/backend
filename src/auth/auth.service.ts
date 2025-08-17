import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { parseTimeToMs } from '../common/constants/time.constants';
import {
  UserNotFoundException,
  OnboardingAlreadyCompletedException,
  PhoneNumberAlreadyExistsException,
  RefreshTokenInvalidException,
  RefreshTokenExpiredException,
  VerificationFailedException,
  AccountMergeFailedException,
} from '../common/exceptions/business.exception';
import { InvalidTokenException } from '../common/exceptions/auth.exception';
import { ulid } from 'ulid';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // dicebear 아바타 URL 생성
  private generateAvatarUrl(userId: string): string {
    // 사용자 ID를 시드로 사용하여 일관된 아바타 생성
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
  }

  // 전화번호 인증 코드 발송
  async sendVerificationCode(
    phoneNumber: string,
  ): Promise<PhoneVerificationResult> {
    return await this.phoneService.sendVerificationCode(phoneNumber);
  }

  // 전화번호 인증 및 로그인
  async verifyPhoneAndLogin(
    phoneNumber: string,
    code: string,
    currentUserId?: string,
  ): Promise<LoginResult> {
    const verificationResult = await this.phoneService.verifyCode(
      phoneNumber,
      code,
    );

    if (!verificationResult.success) {
      throw new VerificationFailedException();
    }

    // Case 1: 기존 전화번호 사용자가 있고 현재 임시 사용자가 있는 경우 -> 계정 통합
    if (verificationResult.existingUser && currentUserId) {
      return await this.mergeAccounts(
        currentUserId,
        verificationResult.existingUser.id,
      );
    }

    // Case 2: 현재 임시 사용자가 있는 경우 -> 임시 사용자에 전화번호 추가
    if (currentUserId) {
      const currentUser = await this.userRepository.findOne({
        where: { id: currentUserId },
      });

      if (currentUser) {
        // 이미 다른 사용자가 이 전화번호를 사용 중인지 확인
        const existingPhoneUser = await this.userRepository.findOne({
          where: { phoneNumber },
        });

        // 다른 사용자가 이 번호를 사용 중이면 계정 통합
        if (existingPhoneUser && existingPhoneUser.id !== currentUserId) {
          return await this.mergeAccounts(currentUserId, existingPhoneUser.id);
        }

        // 임시 사용자에 전화번호 설정
        currentUser.phoneNumber = phoneNumber;
        currentUser.phoneVerifiedAt = new Date();
        await this.userRepository.save(currentUser);

        const tokens = await this.generateTokens(currentUser);

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: currentUser.id,
            phoneNumber: currentUser.phoneNumber,
            status: currentUser.status,
            onboardingCompleted: !!currentUser.onboardingCompletedAt,
          },
          merged: false,
        };
      }
    }

    // Case 3: 기존 사용자 로그인 또는 새 사용자 생성 (일반 전화번호 로그인)
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
      merged: false,
    };
  }

  // 계정 통합 로직
  private async mergeAccounts(
    currentUserId: string,
    existingUserId: string,
  ): Promise<LoginResult> {
    // 현재 사용자 정보 조회
    const currentUser = await this.userRepository.findOne({
      where: { id: currentUserId },
      relations: ['socialAccounts'],
    });

    if (!currentUser) {
      throw new UserNotFoundException(currentUserId);
    }

    // 기존 사용자 정보 조회
    const existingUser = await this.userRepository.findOne({
      where: { id: existingUserId },
      relations: ['socialAccounts'],
    });

    if (!existingUser) {
      throw new UserNotFoundException(existingUserId);
    }

    // 임시 사용자 삭제 전에 이전할 소셜 계정 정보 저장
    const socialAccountsToTransfer =
      (currentUser.socialAccounts as SocialAccount[]) || [];

    // 트랜잭션으로 계정 통합 처리
    let updatedExistingUser:
      | (User & { socialAccounts?: SocialAccount[] })
      | null = null;

    try {
      await this.userRepository.manager.transaction(async (manager) => {
        // 현재 사용자의 토큰을 무효화
        await manager.update(
          AuthToken,
          { userId: currentUserId },
          { isRevoked: true },
        );

        // 현재 사용자의 관련 데이터 삭제
        // UserProfile 삭제 (임시 사용자의 프로필만 삭제, 기존 사용자는 유지)
        await manager.delete(UserProfile, { userId: currentUserId });
        // UserRewards 삭제
        await manager.delete(UserRewards, { userId: currentUserId });
        // AuthToken 삭제 (이미 무효화했지만 삭제 필요함)
        await manager.delete(AuthToken, { userId: currentUserId });

        // 기존 사용자의 마지막 로그인 시간 업데이트
        existingUser.lastLoginAt = new Date();
        await manager.save(existingUser);

        // 소셜 계정의 외래키 제약조건 해제 (userId를 NULL로 설정)
        if (socialAccountsToTransfer.length > 0) {
          for (const socialAccount of socialAccountsToTransfer) {
            await manager.update(
              SocialAccount,
              { id: socialAccount.id },
              { userId: null },
            );
          }
        }

        // 현재 임시 사용자 삭제
        await manager.delete(User, { id: currentUserId });

        // 소셜 계정들을 기존 사용자와 연결
        if (socialAccountsToTransfer.length > 0) {
          for (const socialAccount of socialAccountsToTransfer) {
            // social 계정 userId 업데이트
            await manager.update(
              SocialAccount,
              { id: socialAccount.id },
              { userId: existingUserId },
            );
          }
        }

        // 기존 사용자의 업데이트된 소셜 계정 정보 다시 조회
        updatedExistingUser = await manager.findOne(User, {
          where: { id: existingUserId },
          relations: ['socialAccounts'],
        });

        // 통합 검증 로깅
        if (
          updatedExistingUser?.socialAccounts &&
          Array.isArray(updatedExistingUser.socialAccounts)
        ) {
          this.logger.info('계정 통합 검증: 기존 사용자의 소셜 계정 조회', {
            existingUserId,
            socialAccountsCount: updatedExistingUser.socialAccounts.length,
            socialAccounts: updatedExistingUser.socialAccounts.map((sa) => ({
              id: sa.id,
              provider: sa.provider,
              userId: sa.userId,
            })),
          });
        }
      });
    } catch (error) {
      this.logger.error('계정 통합 실패', {
        currentUserId,
        existingUserId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AccountMergeFailedException(
        '계정 통합 처리 중 오류가 발생했습니다.',
      );
    }

    // 트랜잭션 외부에서 새 토큰 생성 (DB 충돌 방지)
    const tokens = await this.generateTokens(existingUser);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: existingUser.id,
        phoneNumber: existingUser.phoneNumber,
        status: existingUser.status,
        onboardingCompleted: !!existingUser.onboardingCompletedAt,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        socialAccounts:
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          updatedExistingUser && (updatedExistingUser as any).socialAccounts
            ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
              (updatedExistingUser as any).socialAccounts.map(
                (account: SocialAccount) => ({
                  provider: account.provider,
                  email: account.email,
                  profileImageUrl: account.profileImageUrl,
                }),
              )
            : [],
      },
      merged: true,
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
      // 새로운 소셜 로그인 사용자
      // 먼저 이메일로 기존 미완료 온보딩 사용자가 있는지 확인
      let user: User | null = null;

      if (email) {
        // 이메일이 있으면 같은 이메일을 가진 소셜 계정 확인
        const existingSocialAccount =
          await this.socialAccountRepository.findOne({
            where: { email },
            relations: ['user'],
          });

        // 온보딩 미완료 사용자만 재사용
        if (
          existingSocialAccount?.user &&
          !existingSocialAccount.user.onboardingCompletedAt
        ) {
          user = existingSocialAccount.user;
          this.logger.info('온보딩 미완료 사용자 재사용', {
            userId: user.id,
            email,
            provider,
          });
        }
      }

      // 재사용할 사용자가 없으면 새로 생성
      if (!user) {
        user = new User();
        user.phoneNumber = null;
        user.status = UserStatus.ACTIVE;
        user.lastLoginAt = new Date();
        user.onboardingCompletedAt = null;
        user.phoneVerifiedAt = null;
        await this.userRepository.save(user);
      } else {
        // 기존 사용자 재사용 시 마지막 로그인 시간 업데이트
        user.lastLoginAt = new Date();
        await this.userRepository.save(user);
      }

      // 소셜 계정 생성 또는 업데이트하고 User와 연결
      if (socialAccount) {
        socialAccount.userId = user.id;
        socialAccount.accessToken = accessToken;
        if (refreshToken) {
          socialAccount.refreshToken = refreshToken;
        }
        socialAccount.email = email;
        socialAccount.profileImageUrl = profileImage;
        await this.socialAccountRepository.save(socialAccount);
      } else {
        socialAccount = this.socialAccountRepository.create({
          userId: user.id,
          provider,
          providerId,
          email,
          profileImageUrl: profileImage,
          accessToken,
          refreshToken,
        });
        await this.socialAccountRepository.save(socialAccount);
      }

      // 기본 사용자 데이터 생성
      await this.createDefaultUserData(user.id, nickname, profileImage);

      // JWT 토큰 생성 및 반환
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
    }
  }

  // 기본 사용자 데이터 생성
  private async createDefaultUserData(
    userId: string,
    nickname: string,
    profileImage: string,
  ) {
    // UserProfile 생성 (OAuth 정보로 초기화, dicebear 아바타 사용)
    const profile = this.userProfileRepository.create({
      userId,
      nickname: nickname || '알 수 없음',
      profileImageUrl: this.generateAvatarUrl(userId),
      interestIds: [],
      hashtagIds: [],
      birthYear: null,
      gender: null,
      districtId: null,
      bio: null,
      mbti: null,
      points: 0,
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
  async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
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
      Date.now() + parseTimeToMs(accessTokenExpiresIn),
    );
    const refreshExpiresAt = new Date(
      Date.now() + parseTimeToMs(refreshTokenExpiresIn),
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

  async getUserFromToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      // 토큰이 revoked되었는지 확인
      const authToken = await this.authTokenRepository.findOne({
        where: { accessToken: token, isRevoked: false },
      });

      if (!authToken) {
        throw new InvalidTokenException(
          '토큰이 존재하지 않거나 무효화되었습니다.',
        );
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['socialAccounts'],
      });

      if (!user) {
        throw new UserNotFoundException(payload.sub);
      }

      return {
        id: user.id,
        phoneNumber: user.phoneNumber,
        status: user.status,
        onboardingCompleted: !!user.onboardingCompletedAt,
      };
    } catch {
      throw new InvalidTokenException();
    }
  }

  // 리프레시 토큰으로 새 액세스 토큰 발급
  async refreshAccessToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken);

      const authToken = await this.authTokenRepository.findOne({
        where: { refreshToken, isRevoked: false },
      });

      if (!authToken) {
        throw new RefreshTokenInvalidException();
      }

      if (authToken.refreshExpiresAt < new Date()) {
        throw new RefreshTokenExpiredException();
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UserNotFoundException(payload.sub);
      }
      // 새 토큰 생성
      const newTokens = await this.generateTokens(user);

      // 기존 토큰 무효화
      authToken.isRevoked = true;
      await this.authTokenRepository.save(authToken);

      return newTokens;
    } catch (error) {
      this.logger.error('리프레시 토큰 처리 실패', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new RefreshTokenInvalidException();
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
    userId: string,
    request: CompleteOnboardingRequest,
  ): Promise<LoginResult> {
    const {
      phoneNumber,
      nickname,
      birthYear,
      gender,
      districtId,
      interestIds,
      hashtagIds,
      mbti,
      profileImageUrl,
    } = request;

    // 현재 사용자 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['socialAccounts'],
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (user.onboardingCompletedAt) {
      throw new OnboardingAlreadyCompletedException();
    }

    // 전화번호 중복 확인 (현재 사용자 제외하고, 온보딩 완료된 사용자만 체크)
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (
      existingUser &&
      existingUser.id !== userId &&
      existingUser.onboardingCompletedAt
    ) {
      throw new PhoneNumberAlreadyExistsException();
    }

    // User 업데이트 (전화번호 설정 및 온보딩 완료)
    user.phoneNumber = phoneNumber;
    user.onboardingCompletedAt = new Date();
    user.phoneVerifiedAt = new Date(); // 온보딩 완료 시 전화번호도 인증된 것으로 간주
    await this.userRepository.save(user);

    // UserProfile 업데이트
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (profile) {
      profile.nickname = nickname;
      profile.interestIds = interestIds || [];
      profile.hashtagIds = hashtagIds || [];
      profile.birthYear = birthYear;
      profile.gender = gender as Gender;
      profile.districtId = districtId;

      // MBTI 저장
      if (mbti) {
        profile.mbti = mbti;
      }

      // 업로드된 프로필 이미지가 있으면 업데이트
      if (profileImageUrl) {
        profile.profileImageUrl = profileImageUrl;
      }

      await this.userProfileRepository.save(profile);
    }

    // 새로운 토큰 생성
    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        status: user.status,
        onboardingCompleted: true,
        socialAccounts:
          user.socialAccounts && Array.isArray(user.socialAccounts)
            ? user.socialAccounts.map((account: SocialAccount) => ({
                provider: account.provider,
                email: account.email,
                profileImageUrl: account.profileImageUrl,
              }))
            : [],
      },
    };
  }
}
