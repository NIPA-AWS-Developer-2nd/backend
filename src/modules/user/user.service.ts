import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  User,
  UserProfile,
  District,
  UserInterests,
  UserHashtags,
  Gender,
  Level,
} from '../../entities';
import { OnboardingCompleteDto } from './dto/onboarding.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteUserInfo } from './types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(UserInterests)
    private userInterestsRepository: Repository<UserInterests>,
    @InjectRepository(UserHashtags)
    private userHashtagsRepository: Repository<UserHashtags>,
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
  ) {}

  // 포인트로부터 레벨 계산
  private async calculateLevelFromPoints(points: number): Promise<number> {
    // 포인트로 현재 레벨 찾기 (내림차순 정렬으로 첫 번째 결과)
    const level = await this.levelRepository
      .createQueryBuilder('level')
      .where('level.requiredPoints <= :points', { points })
      .orderBy('level.requiredPoints', 'DESC')
      .getOne();

    return level ? level.id : 1; // 레벨을 찾을 수 없으면 1 반환
  }

  // 온보딩 완료
  async completeOnboarding(
    userId: string,
    onboardingData: OnboardingCompleteDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.onboardingCompletedAt) {
      throw new BadRequestException('이미 온보딩이 완료된 사용자입니다.');
    }

    // 전화번호 업데이트 (소셜 로그인 사용자의 경우)
    if (!user.phoneNumber && onboardingData.phoneNumber) {
      // 전화번호 중복 확인
      const existingUser = await this.userRepository.findOne({
        where: { phoneNumber: onboardingData.phoneNumber },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('이미 사용 중인 전화번호입니다.');
      }

      user.phoneNumber = onboardingData.phoneNumber;
      user.phoneVerifiedAt = new Date();
    }

    // 지역 유효성 검사
    const district = await this.districtRepository.findOne({
      where: { id: onboardingData.profile.districtId, isActive: true },
    });

    if (!district) {
      throw new BadRequestException('유효하지 않은 지역입니다.');
    }

    // 관심사 유효성 검사 (categoryIds를 interestIds로 처리)
    if (onboardingData.profile.categoryIds.length > 0) {
      const interests = await this.userInterestsRepository.find({
        where: {
          id: In(onboardingData.profile.categoryIds),
          isActive: true,
        },
      });

      if (interests.length !== onboardingData.profile.categoryIds.length) {
        throw new BadRequestException(
          '유효하지 않은 관심사가 포함되어 있습니다.',
        );
      }
    }

    // 해시태그 유효성 검사
    if (
      onboardingData.profile.hashtagIds &&
      onboardingData.profile.hashtagIds.length > 0
    ) {
      // TODO: 해시태그 테이블이 생성되면 유효성 검사 추가
    }

    // 기존 프로필 확인 후 업데이트 또는 생성
    let userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (userProfile) {
      // 기존 프로필 업데이트
      Object.assign(userProfile, {
        ...onboardingData.profile,
        interestIds: onboardingData.profile.categoryIds, // categoryIds를 interestIds로 매핑
      });
      await this.userProfileRepository.save(userProfile);
    } else {
      // 새 프로필 생성
      userProfile = this.userProfileRepository.create({
        userId,
        ...onboardingData.profile,
        interestIds: onboardingData.profile.categoryIds, // categoryIds를 interestIds로 매핑
      });
      await this.userProfileRepository.save(userProfile);
    }

    // 온보딩 완료 표시
    user.onboardingCompletedAt = new Date();
    await this.userRepository.save(user);

    return {
      success: true,
      message: '온보딩이 완료되었습니다.',
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        onboardingCompleted: true,
        profile: userProfile,
      },
    };
  }

  // 완전한 사용자 정보 조회 (기본 정보 + 프로필)
  async getCompleteUserInfo(userId: string): Promise<CompleteUserInfo> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['socialAccounts'],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    const district = profile?.districtId
      ? await this.districtRepository.findOne({
          where: { id: profile.districtId },
        })
      : null;

    // 관심사 정보 조회
    let interestNames: string[] = [];
    if (profile?.interestIds && profile.interestIds.length > 0) {
      const interests = await this.userInterestsRepository.find({
        where: {
          id: In(profile.interestIds),
          isActive: true,
        },
      });
      interestNames = interests.map((interest) => interest.name);
    }

    // 해시태그 정보 조회
    let hashtagNames: string[] = [];
    if (profile?.hashtagIds && profile.hashtagIds.length > 0) {
      const hashtagData = await this.userHashtagsRepository.find({
        where: {
          id: In(profile.hashtagIds),
          isActive: true,
        },
      });
      hashtagNames = hashtagData.map((hashtag) =>
        hashtag.name.startsWith('#') ? hashtag.name : `#${hashtag.name}`,
      );
    }

    return {
      // 기본 사용자 정보
      id: user.id,
      phoneNumber: user.phoneNumber,
      status: user.status,
      phoneVerifiedAt: user.phoneVerifiedAt,
      onboardingCompletedAt: user.onboardingCompletedAt,
      lastLoginAt: user.lastLoginAt,
      districtVerifiedAt: user.districtVerifiedAt,

      // 프로필 정보
      profile: profile
        ? {
            nickname: profile.nickname,
            profileImageUrl: profile.profileImageUrl,
            bio: profile.bio,
            birthYear: profile.birthYear,
            gender: profile.gender,
            mbti: profile.mbti,
            interests: interestNames,
            hashtags: hashtagNames,
            points: profile.points,
            level: await this.calculateLevelFromPoints(profile.points),
            district: district
              ? {
                  id: district.id,
                  name: district.districtName,
                  city: district.city,
                }
              : null,
          }
        : null,

      // 소셜 계정 정보
      socialAccounts: user.socialAccounts
        ? user.socialAccounts.map((account) => ({
            provider: account.provider,
            email: account.email,
            profileImageUrl: account.profileImageUrl,
          }))
        : [],
    };
  }

  // 사용자 프로필 조회 (기존 유지)
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    const _district = profile?.districtId
      ? await this.districtRepository.findOne({
          where: { id: profile.districtId },
        })
      : null;

    // 관심사 정보 조회 (name과 icon 함께)
    let interests: Array<{ name: string; icon: string }> = [];
    if (profile?.interestIds && profile.interestIds.length > 0) {
      const interestData = await this.userInterestsRepository.find({
        where: {
          id: In(profile.interestIds),
          isActive: true,
        },
      });
      interests = interestData.map((interest) => ({
        name: interest.name,
        icon: interest.icon || '',
      }));
    }

    let hashtags: string[] = [];
    if (profile?.hashtagIds && profile.hashtagIds.length > 0) {
      const hashtagData = await this.userHashtagsRepository.find({
        where: {
          id: In(profile.hashtagIds),
          isActive: true,
        },
      });
      hashtags = hashtagData.map((hashtag) =>
        hashtag.name.startsWith('#') ? hashtag.name : `#${hashtag.name}`,
      );
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      nickname: profile?.nickname,
      birthYear: profile?.birthYear,
      gender: profile?.gender,
      bio: profile?.bio,
      profileImageUrl: profile?.profileImageUrl,
      interests,
      hashtags,
      mbti: profile?.mbti,
      districtId: profile?.districtId,
      points: profile?.points,
      level: profile?.points
        ? await this.calculateLevelFromPoints(profile.points)
        : 1,
      onboardingCompletedAt: user.onboardingCompletedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 사용자 프로필 업데이트
  async updateUserProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<CompleteUserInfo> {
    // 사용자 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 기존 프로필 조회
    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['district'],
    });

    if (!userProfile) {
      throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
    }

    // 관심사 ID 유효성 검증 (제공된 경우만)
    if (
      updateProfileDto.userInterestIds &&
      updateProfileDto.userInterestIds.length > 0
    ) {
      const interestIds = updateProfileDto.userInterestIds;
      const validInterests = await this.userInterestsRepository.find({
        where: { id: In(interestIds), isActive: true },
      });

      if (validInterests.length !== interestIds.length) {
        throw new BadRequestException(
          '유효하지 않은 관심사 ID가 포함되어 있습니다.',
        );
      }

      // 관심사 ID 업데이트
      userProfile.interestIds = interestIds;
    }

    // 해시태그 ID 유효성 검증 (제공된 경우만)
    if (
      updateProfileDto.userHashtagIds &&
      updateProfileDto.userHashtagIds.length > 0
    ) {
      const hashtagIds = updateProfileDto.userHashtagIds;
      const validHashtags = await this.userHashtagsRepository.find({
        where: { id: In(hashtagIds), isActive: true },
      });

      if (validHashtags.length !== hashtagIds.length) {
        throw new BadRequestException(
          '유효하지 않은 해시태그 ID가 포함되어 있습니다.',
        );
      }

      // 해시태그 ID 업데이트
      userProfile.hashtagIds = hashtagIds;
    }

    // 다른 필드들 업데이트
    if (updateProfileDto.nickname !== undefined) {
      userProfile.nickname = updateProfileDto.nickname;
    }
    if (updateProfileDto.bio !== undefined) {
      userProfile.bio = updateProfileDto.bio;
    }
    if (updateProfileDto.profileImageUrl !== undefined) {
      userProfile.profileImageUrl = updateProfileDto.profileImageUrl;
    }
    if (updateProfileDto.mbti !== undefined) {
      userProfile.mbti = updateProfileDto.mbti;
    }
    if (updateProfileDto.districtId !== undefined) {
      userProfile.districtId = updateProfileDto.districtId;
    }
    if (updateProfileDto.birthYear !== undefined) {
      userProfile.birthYear = updateProfileDto.birthYear;
    }
    if (updateProfileDto.gender !== undefined) {
      userProfile.gender =
        updateProfileDto.gender === 'male' ? Gender.MALE : Gender.FEMALE;
    }

    // 저장
    await this.userProfileRepository.save(userProfile);

    // 업데이트된 정보 반환
    return this.getCompleteUserInfo(userId);
  }

  // 활동 통계 조회
  async getActivityStats(userId: string) {
    // 사용자 확인
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 현재는 임시 데이터 반환 (실제로는 다른 테이블들과 조인해야 함)
    // TODO: 실제 미션, 리뷰, 모임 테이블이 생성되면 실제 통계 조회로 변경
    return {
      verificationCount: 0, // TODO: 미션 인증 테이블에서 조회
      reviewCount: 0, // TODO: 리뷰 테이블에서 조회
      hostedMeetingCount: 0, // TODO: 모임 테이블에서 주최한 모임 수 조회
      completedMissionCount: 0, // TODO: 완료된 미션 수 조회
    };
  }
}
