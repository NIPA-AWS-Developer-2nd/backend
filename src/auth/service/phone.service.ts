import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User, UserStatus, UserProfile } from '../../entities';
import { TIME_MULTIPLIERS } from '../../common/constants/time.constants';

export interface PhoneVerificationResult {
  success: boolean;
  message: string;
  existingUser?: {
    id: string;
    hasProfile: boolean;
    nickname?: string;
    profileImageUrl?: string;
  };
}

@Injectable()
export class PhoneService {
  // 임시로 메모리에 인증 코드 저장
  // TODO: Redis 사용
  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  // 인증 코드 발송
  sendVerificationCode(phoneNumber: string): PhoneVerificationResult {
    // 전화번호 형식 검증
    if (!/^\d{11}$/.test(phoneNumber)) {
      throw new BadRequestException('올바른 전화번호 형식이 아닙니다.');
    }

    // 6자리 랜덤 코드 생성
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // 5분 후 만료
    const expiresAt = new Date(Date.now() + 5 * TIME_MULTIPLIERS.m);

    // 메모리에 저장
    // TODO: Redis 사용
    this.verificationCodes.set(phoneNumber, {
      code: verificationCode,
      expiresAt,
    });

    // 실제 SMS 발송 로직 (여기서는 로그로 대체)
    this.logger.info(`[SMS] ${phoneNumber}: 인증코드 ${verificationCode}`, {
      phoneNumber,
      verificationCode,
      action: 'send_verification_code',
    });

    // TODO: 실제 SMS 서비스 연동

    return {
      success: true,
      message: '인증 코드가 발송되었습니다.',
    };
  }

  // 인증 코드 검증
  async verifyCode(
    phoneNumber: string,
    code: string,
  ): Promise<PhoneVerificationResult> {
    const stored = this.verificationCodes.get(phoneNumber);

    if (!stored) {
      throw new BadRequestException('인증 코드가 발송되지 않았습니다.');
    }

    if (new Date() > stored.expiresAt) {
      this.verificationCodes.delete(phoneNumber);
      throw new BadRequestException('인증 코드가 만료되었습니다.');
    }

    if (stored.code !== code) {
      throw new BadRequestException('잘못된 인증 코드입니다.');
    }

    // 인증 성공 후 코드 삭제
    this.verificationCodes.delete(phoneNumber);

    // 기존 사용자 확인
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser) {
      // 사용자 프로필 정보 조회
      const profile = await this.userProfileRepository.findOne({
        where: { userId: existingUser.id },
      });

      // 기존 사용자가 있는 경우 - 자동 통합
      return {
        success: true,
        message:
          '이미 가입된 전화번호가 존재합니다. 통합된 계정으로 로그인됩니다.',
        existingUser: {
          id: existingUser.id,
          hasProfile: !!existingUser.onboardingCompletedAt,
          nickname: profile?.nickname,
          profileImageUrl: profile?.profileImageUrl,
        },
      };
    }

    // 새로운 사용자인 경우
    return {
      success: true,
      message: '전화번호 인증이 완료되었습니다.',
    };
  }

  // 사용자 생성 또는 조회
  async findOrCreateUser(phoneNumber: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (!user) {
      user = this.userRepository.create({
        phoneNumber,
        phoneVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(user);
    } else {
      // 기존 사용자의 인증 시간 업데이트
      user.phoneVerifiedAt = new Date();
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
    }

    return user;
  }
}
