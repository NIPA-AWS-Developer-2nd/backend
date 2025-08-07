import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserProfile, District, Category } from '../../entities';
import { CreateUserDto } from './dto/create-user.dto';
import { OnboardingCompleteDto } from './dto/onboarding.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

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

    // 카테고리 유효성 검사
    if (onboardingData.profile.categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: {
          id: In(onboardingData.profile.categoryIds),
          isActive: true,
        },
      });

      if (categories.length !== onboardingData.profile.categoryIds.length) {
        throw new BadRequestException(
          '유효하지 않은 카테고리가 포함되어 있습니다.',
        );
      }
    }

    // 기존 프로필 확인 후 업데이트 또는 생성
    let userProfile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (userProfile) {
      // 기존 프로필 업데이트
      Object.assign(userProfile, onboardingData.profile);
      await this.userProfileRepository.save(userProfile);
    } else {
      // 새 프로필 생성
      userProfile = this.userProfileRepository.create({
        userId,
        ...onboardingData.profile,
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

  // 사용자 프로필 조회
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

    const district = profile?.districtId
      ? await this.districtRepository.findOne({
          where: { id: profile.districtId },
        })
      : null;

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      status: user.status,
      onboardingCompleted: !!user.onboardingCompletedAt,
      profile: profile
        ? {
            ...profile,
            district: district
              ? {
                  id: district.id,
                  name: district.districtName,
                  city: district.city,
                }
              : null,
          }
        : null,
    };
  }

  // 사용 가능한 지역 목록 조회
  async getDistricts() {
    return this.districtRepository.find({
      where: { isActive: true },
      order: { districtName: 'ASC' },
    });
  }

  // 사용 가능한 카테고리 목록 조회
  async getCategories() {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  // 데이터 생성
  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  // 모든 데이터 읽기
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  // 특정 데이터 삭제
  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
