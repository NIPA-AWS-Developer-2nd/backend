import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import {
  District,
  Category,
  Level,
  UserInterests,
  UserHashtags,
  User,
  UserProfile,
  UserRewards,
} from '../../entities';
import { UserStatus } from '../../entities/user.entity';
import { Gender } from '../../entities/user-profile.entity';

export const seedInitialData = async (dataSource: DataSource) => {
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${String(timestamp)}] ${String(level)}: ${String(message)}`;
      }),
    ),
    transports: [new winston.transports.Console()],
  });
  const districtRepository = dataSource.getRepository(District);
  const categoryRepository = dataSource.getRepository(Category);
  const levelRepository = dataSource.getRepository(Level);
  const userInterestsRepository = dataSource.getRepository(UserInterests);
  const userHashtagsRepository = dataSource.getRepository(UserHashtags);
  const userRepository = dataSource.getRepository(User);
  const userProfileRepository = dataSource.getRepository(UserProfile);
  const userRewardsRepository = dataSource.getRepository(UserRewards);

  // 서울 구 데이터 시딩
  const seoulDistricts = [
    {
      regionCode: '11110',
      districtName: '종로구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11140',
      districtName: '중구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11170',
      districtName: '용산구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11200',
      districtName: '성동구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11215',
      districtName: '광진구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11230',
      districtName: '동대문구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11260',
      districtName: '중랑구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11290',
      districtName: '성북구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11305',
      districtName: '강북구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11320',
      districtName: '도봉구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11350',
      districtName: '노원구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11380',
      districtName: '은평구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11410',
      districtName: '서대문구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11440',
      districtName: '마포구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11470',
      districtName: '양천구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11500',
      districtName: '강서구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11530',
      districtName: '구로구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11545',
      districtName: '금천구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11560',
      districtName: '영등포구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11590',
      districtName: '동작구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11620',
      districtName: '관악구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11650',
      districtName: '서초구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11680',
      districtName: '강남구',
      city: '서울특별시',
      isActive: false,
    },
    {
      regionCode: '11710',
      districtName: '송파구',
      city: '서울특별시',
      isActive: true,
    },
    {
      regionCode: '11740',
      districtName: '강동구',
      city: '서울특별시',
      isActive: false,
    },
  ];

  // 기존 지역 데이터 확인 후 없으면 생성
  for (const districtData of seoulDistricts) {
    const existingDistrict = await districtRepository.findOne({
      where: { regionCode: districtData.regionCode },
    });

    if (!existingDistrict) {
      const district = districtRepository.create(districtData);
      await districtRepository.save(district);
    }
  }

  // 미션 카테고리 데이터 시딩
  const categories = [
    { name: '음식', slug: 'food', icon: 'Utensils' },
    { name: '문화/예술', slug: 'culture', icon: 'Palette' },
    { name: '카페', slug: 'cafe', icon: 'Coffee' },
    { name: '스포츠', slug: 'sports', icon: 'Dumbbell' },
    { name: '게임', slug: 'gaming', icon: 'Gamepad2' },
    { name: '사진', slug: 'photo', icon: 'Camera' },
    { name: '쇼핑', slug: 'shopping', icon: 'ShoppingBag' },
    { name: '음악', slug: 'music', icon: 'Music' },
    { name: '봉사활동', slug: 'volunteer_work', icon: 'Heart' },
    { name: '여행', slug: 'travel', icon: 'Plane' },
    { name: '반려동물', slug: 'pets', icon: 'Cat' },
  ];

  for (const categoryData of categories) {
    const existingCategory = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });

    if (!existingCategory) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
    }
  }

  // 레벨 시스템 데이터 시딩
  const levels = [
    { requiredPoints: 0, name: '1', rewardAiTickets: 0 },
    { requiredPoints: 200, name: '2', rewardAiTickets: 1 },
    { requiredPoints: 450, name: '3', rewardAiTickets: 1 },
    { requiredPoints: 750, name: '4', rewardAiTickets: 1 },
    { requiredPoints: 1100, name: '5', rewardAiTickets: 1 },
    { requiredPoints: 1500, name: '6', rewardAiTickets: 1 },
    { requiredPoints: 1950, name: '7', rewardAiTickets: 1 },
    { requiredPoints: 2450, name: '8', rewardAiTickets: 1 },
    { requiredPoints: 3000, name: '9', rewardAiTickets: 1 },
    { requiredPoints: 3600, name: '10', rewardAiTickets: 1 },
    { requiredPoints: 4300, name: '11', rewardAiTickets: 1 },
    { requiredPoints: 5100, name: '12', rewardAiTickets: 1 },
    { requiredPoints: 6000, name: '13', rewardAiTickets: 2 },
    { requiredPoints: 7000, name: '14', rewardAiTickets: 2 },
    { requiredPoints: 8150, name: '15', rewardAiTickets: 2 },
    { requiredPoints: 9450, name: '16', rewardAiTickets: 2 },
    { requiredPoints: 10900, name: '17', rewardAiTickets: 2 },
    { requiredPoints: 12500, name: '18', rewardAiTickets: 2 },
    { requiredPoints: 14250, name: '19', rewardAiTickets: 2 },
    { requiredPoints: 16150, name: '20', rewardAiTickets: 3 },
    { requiredPoints: 18200, name: '21', rewardAiTickets: 3 },
    { requiredPoints: 20400, name: '22', rewardAiTickets: 3 },
    { requiredPoints: 22750, name: '23', rewardAiTickets: 4 },
    { requiredPoints: 25250, name: '24', rewardAiTickets: 4 },
    { requiredPoints: 27900, name: '25', rewardAiTickets: 4 },
    { requiredPoints: 30700, name: '26', rewardAiTickets: 5 },
    { requiredPoints: 33650, name: '27', rewardAiTickets: 5 },
    { requiredPoints: 36750, name: '28', rewardAiTickets: 6 },
    { requiredPoints: 40000, name: '29', rewardAiTickets: 6 },
    { requiredPoints: 43400, name: '30', rewardAiTickets: 7 },
  ];

  for (const levelData of levels) {
    const existingLevel = await levelRepository.findOne({
      where: { requiredPoints: levelData.requiredPoints },
    });

    if (!existingLevel) {
      const level = levelRepository.create(levelData);
      await levelRepository.save(level);
    }
  }

  // 사용자 관심사 데이터 시딩
  const userInterests = [
    { name: '맛집 투어', slug: 'food_tour', icon: '🍽️' },
    { name: '액티비티', slug: 'activity', icon: '🏃' },
    { name: '여행', slug: 'travel', icon: '✈️' },
    { name: '음악', slug: 'music', icon: '🎵' },
    { name: '패션', slug: 'fashion', icon: '👗' },
    { name: '오락', slug: 'entertainment', icon: '🎮' },
    { name: '전시/공연', slug: 'exhibition', icon: '🎨' },
    { name: '봉사활동', slug: 'volunteer', icon: '❤️' },
    { name: '반려동물', slug: 'pets', icon: '🐕' },
    { name: '카페', slug: 'cafe', icon: '☕' },
    { name: '사진', slug: 'photography', icon: '📷' },
    { name: '영화', slug: 'movie', icon: '🎬' },
  ];

  for (const interestData of userInterests) {
    const existingInterest = await userInterestsRepository.findOne({
      where: { slug: interestData.slug },
    });

    if (!existingInterest) {
      const interest = userInterestsRepository.create(interestData);
      await userInterestsRepository.save(interest);
    }
  }

  // 사용자 해시태그 데이터 시딩
  const userHashtags = [
    { name: '#웃음이넘치는' },
    { name: '#열정적인' },
    { name: '#차분한' },
    { name: '#긍정적인' },
    { name: '#활동적인' },
    { name: '#자유로운' },
    { name: '#진지한' },
    { name: '#활발한' },
    { name: '#창의적인' },
    { name: '#수다를좋아하는' },
    { name: '#점잖은' },
    { name: '#현실적인' },
    { name: '#공감능력' },
    { name: '#도전적인' },
    { name: '#섬세한' },
  ];

  for (const hashtagData of userHashtags) {
    const existingHashtag = await userHashtagsRepository.findOne({
      where: { name: hashtagData.name },
    });

    if (!existingHashtag) {
      const hashtag = userHashtagsRepository.create(hashtagData);
      await userHashtagsRepository.save(hashtag);
    }
  }

  // 테스트 계정 생성
  const testUserExists = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });

  if (!testUserExists) {
    // 활성화된 구 찾기 (송파구)
    const songpaDistrict = await districtRepository.findOne({
      where: { districtName: '송파구', isActive: true },
    });

    // 첫 번째 관심사와 해시태그 가져오기
    const firstInterest = await userInterestsRepository.findOne({
      where: { slug: 'food_tour' },
    });
    const firstHashtag = await userHashtagsRepository.findOne({
      where: { name: '#웃음이넘치는' },
    });

    if (songpaDistrict && firstInterest && firstHashtag) {
      const testUserId = ulid();

      // 테스트 사용자 생성
      const testUser = userRepository.create({
        id: testUserId,
        phoneNumber: '01012345678',
        phoneVerifiedAt: new Date(),
        onboardingCompletedAt: new Date(),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(testUser);

      // 테스트 사용자 프로필 생성
      const testProfile = userProfileRepository.create({
        userId: testUserId,
        nickname: '테스트계정',
        profileImageUrl: '',
        bio: '테스트를 위한 계정입니다.',
        birthYear: 1995,
        gender: Gender.MALE,
        mbti: 'INFJ',
        interestIds: [firstInterest.id],
        hashtagIds: [firstHashtag.id],
        districtId: songpaDistrict.id,
        points: 1024,
      });
      await userProfileRepository.save(testProfile);

      // 테스트 사용자 보상 생성
      const testRewards = userRewardsRepository.create({
        userId: testUserId,
        aiMissionTickets: 3,
      });
      await userRewardsRepository.save(testRewards);
    }
  }

  logger.info('🌱 Initial data seeding has been completed.');
};
