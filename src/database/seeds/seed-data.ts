import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import * as starvingOrange from 'starving-orange';
import {
  District,
  Category,
  Level,
  UserInterests,
  UserHashtags,
  User,
  UserProfile,
  UserRewards,
  Mission,
  Meeting,
  MeetingParticipant,
} from '../../entities';
import { UserStatus } from '../../entities/user.entity';
import { Gender } from '../../entities/user-profile.entity';
import { MissionDifficulty } from '../../entities/mission.entity';
import { MeetingStatus } from '../../entities/meeting.entity';
import { ParticipantStatus } from '../../entities/meeting-participant.entity';

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
  const missionRepository = dataSource.getRepository(Mission);
  const meetingRepository = dataSource.getRepository(Meeting);
  const participantRepository = dataSource.getRepository(MeetingParticipant);

  // 서울 구 데이터 시딩
  const seoulDistricts = [
    {
      regionCode: '11110',
      districtName: '종로구',
      city: '서울특별시',
      latitude: 37.5735207,
      longitude: 126.9788418,
      isActive: false,
    },
    {
      regionCode: '11140',
      districtName: '중구',
      city: '서울특별시',
      latitude: 37.5640907,
      longitude: 126.9979879,
      isActive: false,
    },
    {
      regionCode: '11170',
      districtName: '용산구',
      city: '서울특별시',
      latitude: 37.5324,
      longitude: 126.9906,
      isActive: false,
    },
    {
      regionCode: '11200',
      districtName: '성동구',
      city: '서울특별시',
      latitude: 37.5634,
      longitude: 127.0371,
      isActive: false,
    },
    {
      regionCode: '11215',
      districtName: '광진구',
      city: '서울특별시',
      latitude: 37.5387,
      longitude: 127.0823,
      isActive: false,
    },
    {
      regionCode: '11230',
      districtName: '동대문구',
      city: '서울특별시',
      latitude: 37.5744,
      longitude: 127.0396,
      isActive: false,
    },
    {
      regionCode: '11260',
      districtName: '중랑구',
      city: '서울특별시',
      latitude: 37.6065,
      longitude: 127.0926,
      isActive: false,
    },
    {
      regionCode: '11290',
      districtName: '성북구',
      city: '서울특별시',
      latitude: 37.5894,
      longitude: 127.0167,
      isActive: false,
    },
    {
      regionCode: '11305',
      districtName: '강북구',
      city: '서울특별시',
      latitude: 37.6398,
      longitude: 127.0256,
      isActive: false,
    },
    {
      regionCode: '11320',
      districtName: '도봉구',
      city: '서울특별시',
      latitude: 37.6687,
      longitude: 127.0471,
      isActive: false,
    },
    {
      regionCode: '11350',
      districtName: '노원구',
      city: '서울특별시',
      latitude: 37.6542,
      longitude: 127.0568,
      isActive: false,
    },
    {
      regionCode: '11380',
      districtName: '은평구',
      city: '서울특별시',
      latitude: 37.6176,
      longitude: 126.9227,
      isActive: false,
    },
    {
      regionCode: '11410',
      districtName: '서대문구',
      city: '서울특별시',
      latitude: 37.5791,
      longitude: 126.9368,
      isActive: false,
    },
    {
      regionCode: '11440',
      districtName: '마포구',
      city: '서울특별시',
      latitude: 37.5663,
      longitude: 126.9016,
      isActive: false,
    },
    {
      regionCode: '11470',
      districtName: '양천구',
      city: '서울특별시',
      latitude: 37.517,
      longitude: 126.8662,
      isActive: false,
    },
    {
      regionCode: '11500',
      districtName: '강서구',
      city: '서울특별시',
      latitude: 37.5509,
      longitude: 126.8495,
      isActive: false,
    },
    {
      regionCode: '11530',
      districtName: '구로구',
      city: '서울특별시',
      latitude: 37.4954,
      longitude: 126.8874,
      isActive: false,
    },
    {
      regionCode: '11545',
      districtName: '금천구',
      city: '서울특별시',
      latitude: 37.4567,
      longitude: 126.8955,
      isActive: false,
    },
    {
      regionCode: '11560',
      districtName: '영등포구',
      city: '서울특별시',
      latitude: 37.5264,
      longitude: 126.8962,
      isActive: false,
    },
    {
      regionCode: '11590',
      districtName: '동작구',
      city: '서울특별시',
      latitude: 37.5124,
      longitude: 126.9393,
      isActive: false,
    },
    {
      regionCode: '11620',
      districtName: '관악구',
      city: '서울특별시',
      latitude: 37.4784,
      longitude: 126.9516,
      isActive: false,
    },
    {
      regionCode: '11650',
      districtName: '서초구',
      city: '서울특별시',
      latitude: 37.4837,
      longitude: 127.0327,
      isActive: false,
    },
    {
      regionCode: '11680',
      districtName: '강남구',
      city: '서울특별시',
      latitude: 37.5173,
      longitude: 127.0473,
      isActive: false,
    },
    {
      regionCode: '11710',
      districtName: '송파구',
      city: '서울특별시',
      latitude: 37.5145,
      longitude: 127.1056,
      isActive: true,
    },
    {
      regionCode: '11740',
      districtName: '강동구',
      city: '서울특별시',
      latitude: 37.5301,
      longitude: 127.1238,
      isActive: false,
    },
  ];

  // 기존 지역 데이터 확인 후 없으면 생성, 있으면 위도/경도 업데이트
  for (const districtData of seoulDistricts) {
    const existingDistrict = await districtRepository.findOne({
      where: { regionCode: districtData.regionCode },
    });

    if (!existingDistrict) {
      const district = districtRepository.create(districtData);
      await districtRepository.save(district);
      logger.info(`새 지역 생성: ${districtData.districtName}`);
    } else {
      // 기존 데이터에 위도/경도 정보 업데이트
      existingDistrict.latitude = districtData.latitude;
      existingDistrict.longitude = districtData.longitude;
      await districtRepository.save(existingDistrict);
      logger.info(
        `지역 좌표 업데이트: ${districtData.districtName} (${districtData.latitude}, ${districtData.longitude})`,
      );
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

  // 미션 시드 데이터 타입 정의
  interface MissionSeedData {
    id: string;
    title: string;
    description: string;
    basePoints: number;
    estimatedDuration: number;
    participants: number;
    minimumDuration: number;
    difficulty: MissionDifficulty;
    thumbnailUrl: string;
    categorySlug: string;
    location?: string;
    photoVerificationGuide: string;
    sampleImageUrls: string[];
    precautions: string[];
  }

  // 미션 데이터 시딩 - 5개 난이도별 포인트 (500, 1000, 1500, 2000, 2500)
  const missionData: MissionSeedData[] = [
    {
      id: '01JG9H7E2FQMC8GN1VKXR6W3T9',
      title: '송파구 카페 방문',
      description: '송파구의 특색있는 카페를 방문하고 음료와 함께 인증하세요.',
      basePoints: 500,
      estimatedDuration: 90,
      participants: 6,
      minimumDuration: 60,
      difficulty: MissionDifficulty.VERY_EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      categorySlug: 'cafe',
      location: '석촌호수 카페거리',
      photoVerificationGuide:
        'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      ],
      precautions: [
        '음료 비용은 개인 부담입니다',
        '카페 내부 촬영 시 다른 손님에게 민폐가 되지 않도록 주의하세요',
        '혼잡한 시간대는 피해서 방문하세요',
      ],
    },
    {
      id: '01JG9H7E2GQMC8GN1VKXR6W3TA',
      title: '송파구 맛집 방문하기',
      description:
        '송파구 내 인기 맛집을 방문하고 인증 사진을 업로드해 주세요.',
      basePoints: 1000,
      estimatedDuration: 120,
      participants: 6,
      minimumDuration: 90,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'food',
      photoVerificationGuide:
        'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400',
      ],
      precautions: [
        '예약이 필요한 맛집은 미리 확인하세요',
        '식사 비용은 개인 부담입니다',
        '알레르기가 있는 경우 미리 확인하세요',
      ],
    },
    {
      id: '01JG9H7E2HQMC8GN1VKXR6W3TB',
      title: '송파구 박물관 탐방',
      description:
        '송파구 내 박물관을 방문하고 전시품과 함께 사진을 촬영하세요.',
      basePoints: 1500,
      estimatedDuration: 180,
      participants: 6,
      minimumDuration: 120,
      difficulty: MissionDifficulty.MEDIUM,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      categorySlug: 'culture',
      location: '한성백제박물관',
      photoVerificationGuide:
        'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400',
        'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400',
      ],
      precautions: [
        '입장료는 개인 부담입니다',
        '전시품 촬영 시 플래시 사용 금지 여부를 확인하세요',
        '박물관 내부에서는 조용히 관람해주세요',
      ],
    },
    {
      id: '01JG9H7E2JQMC8GN1VKXR6W3TC',
      title: '송파구 롯데월드 어트랙션 체험',
      description:
        '송파구 롯데월드에서 5개 이상의 어트랙션을 체험하고 사진을 공유하세요.',
      basePoints: 2000,
      estimatedDuration: 240,
      participants: 10,
      minimumDuration: 180,
      difficulty: MissionDifficulty.HARD,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1465996140498-df84be101126?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'culture',
      location: '롯데월드',
      photoVerificationGuide:
        'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1465996140498-df84be101126?w=400',
        'https://images.unsplash.com/photo-1586882829491-b81178aa622e?w=400',
        'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=400',
      ],
      precautions: [
        '입장료 및 이용료는 개인 부담입니다',
        '어트랙션 이용 제한이 있을 수 있으니 확인하세요',
        '혼잡한 시간대를 피해 방문하는 것을 권장합니다',
      ],
    },
    {
      id: '01JG9H7E2KQMC8GN1VKXR6W3TD',
      title: '송파구 한강공원 러닝 5km 완주',
      description: '송파구 한강공원에서 5km 러닝을 완주하고 기록을 인증하세요.',
      basePoints: 2500,
      estimatedDuration: 90,
      participants: 8,
      minimumDuration: 60,
      difficulty: MissionDifficulty.VERY_HARD,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1659242710553-3f8513f136b3?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'sports',
      location: '한강공원 잠실지구',
      photoVerificationGuide:
        'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400',
        'https://images.unsplash.com/photo-1659242710553-3f8513f136b3?w=400',
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
      ],
      precautions: [
        '준비운동을 충분히 하고 시작하세요',
        '개인 체력에 맞춰 무리하지 마세요',
        '수분 보충용 물을 꼭 준비하세요',
      ],
    },
  ];

  // 송파구 district ID 찾기
  const songpaDistrictForMissions = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  if (!songpaDistrictForMissions) {
    logger.error(
      '송파구 정보를 찾을 수 없습니다. 미션 시드 데이터를 건너뜁니다.',
    );
  } else {
    // 미션 데이터 생성
    for (const mission of missionData) {
      // 기존 미션 확인
      const existingMission = await missionRepository.findOne({
        where: { id: mission.id },
      });

      if (existingMission) {
        continue; // 이미 존재하면 건너뜀
      }

      // 카테고리 찾기
      const category = await categoryRepository.findOne({
        where: { slug: mission.categorySlug },
      });

      if (!category) {
        logger.warn(
          `카테고리 '${mission.categorySlug}'를 찾을 수 없어 미션 '${mission.title}'를 건너뜁니다.`,
        );
        continue;
      }

      // 미션 생성
      const newMission = missionRepository.create({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        basePoints: mission.basePoints,
        estimatedDuration: mission.estimatedDuration,
        participants: mission.participants,
        minimumDuration: mission.minimumDuration,
        difficulty: mission.difficulty,
        thumbnailUrl: mission.thumbnailUrl,
        missionCategoryId: category.id,
        photoVerificationGuide: mission.photoVerificationGuide,
        sampleImageUrls: mission.sampleImageUrls,
        precautions: mission.precautions,
        districtId: songpaDistrictForMissions.id,
        location: mission.location || null,
        isActive: true,
      });

      await missionRepository.save(newMission);
      logger.info(`미션 '${mission.title}' 시드 데이터가 생성되었습니다.`);
    }
  }

  // 테스트 계정들 생성
  const hostUserExists = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });

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
    // 호스트 테스트 계정 생성 (01012345678)
    if (!hostUserExists) {
      const hostUserId = ulid();

      // 호스트 테스트 사용자 생성
      const hostUser = userRepository.create({
        id: hostUserId,
        phoneNumber: '01012345678',
        phoneVerifiedAt: new Date(),
        lastLocationVerificationAt: new Date(),
        onboardingCompletedAt: new Date(),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(hostUser);

      // 호스트 테스트 사용자 프로필 생성
      const hostProfile = userProfileRepository.create({
        userId: hostUserId,
        nickname: '테스트계정',
        profileImageUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=테스트계정',
        bio: '호스트 테스트를 위한 계정입니다.',
        birthYear: 1995,
        gender: Gender.MALE,
        mbti: 'INFJ',
        interestIds: [firstInterest.id],
        hashtagIds: [firstHashtag.id],
        districtId: songpaDistrict.id,
        points: 6500,
      });
      await userProfileRepository.save(hostProfile);

      // 호스트 테스트 사용자 보상 생성
      const hostRewards = userRewardsRepository.create({
        userId: hostUserId,
        aiMissionTickets: 3,
      });
      await userRewardsRepository.save(hostRewards);

      logger.info('호스트 테스트 계정 생성: 01012345678 (테스트계정)');
    }

    // 참가자 테스트 계정 생성
    const existingParticipant = await userRepository.findOne({
      where: { phoneNumber: '01011112222' },
    });

    if (!existingParticipant) {
      const participantUserId = ulid();

      // 참가자 테스트 사용자 생성
      const participantUser = userRepository.create({
        id: participantUserId,
        phoneNumber: '01011112222',
        phoneVerifiedAt: new Date(),
        lastLocationVerificationAt: new Date(),
        onboardingCompletedAt: new Date(),
        lastLoginAt: new Date(),
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(participantUser);

      // 참가자 테스트 사용자 프로필 생성
      const participantProfile = userProfileRepository.create({
        userId: participantUserId,
        nickname: '참가자테스트',
        profileImageUrl:
          'https://api.dicebear.com/7.x/avataaars/svg?seed=참가자테스트',
        bio: '참가자 테스트를 위한 계정입니다.',
        birthYear: 1998,
        gender: Gender.FEMALE,
        mbti: 'ENFP',
        interestIds: [firstInterest.id],
        hashtagIds: [firstHashtag.id],
        districtId: songpaDistrict.id,
        points: 3200,
      });
      await userProfileRepository.save(participantProfile);

      // 참가자 테스트 사용자 보상 생성
      const participantRewards = userRewardsRepository.create({
        userId: participantUserId,
        aiMissionTickets: 2,
      });
      await userRewardsRepository.save(participantRewards);

      logger.info('참가자 테스트 계정 생성: 01011112222 (참가자테스트)');
    }
  }

  // 20명의 더미 사용자 생성
  const activeSongpaDistrict = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  const allInterests = await userInterestsRepository.find();
  const allHashtags = await userHashtagsRepository.find();

  if (
    activeSongpaDistrict &&
    allInterests.length > 0 &&
    allHashtags.length > 0
  ) {
    // 010######## 형식의 랜덤 번호 20개 생성
    const phoneNumbers: string[] = [];
    const phoneSet = new Set<string>();
    while (phoneNumbers.length < 20) {
      const randomNumber = Math.floor(Math.random() * 1_0000_0000)
        .toString()
        .padStart(8, '0');
      const phone = `010${randomNumber}`;
      if (!phoneSet.has(phone)) {
        phoneNumbers.push(phone);
        phoneSet.add(phone);
      }
    }

    const genders = [Gender.MALE, Gender.FEMALE, Gender.OTHER, null];

    // Type-safe random gender selection helper
    const getRandomGender = (): Gender | null => {
      const randomIndex = Math.floor(Math.random() * genders.length);
      return genders[randomIndex] ?? null;
    };

    const mbtiTypes = [
      'INFP',
      'ENFP',
      'INFJ',
      'ENFJ',
      'INTJ',
      'ENTJ',
      'INTP',
      'ENTP',
      'ISFP',
      'ESFP',
      'ISTP',
      'ESTP',
      'ISFJ',
      'ESFJ',
      'ISTJ',
      'ESTJ',
    ];

    for (let i = 0; i < 20; i++) {
      const phoneNumber = phoneNumbers[i];

      // 이미 존재하는 사용자인지 확인
      const existingUser = await userRepository.findOne({
        where: { phoneNumber },
      });

      if (existingUser) {
        continue; // 이미 존재하면 건너뜀
      }

      const userId = ulid();
      const nicknameResult = starvingOrange.generateNickname({
        noSpacing: true,
      });
      const nickname = nicknameResult.nickname;

      // 랜덤한 관심사 6개 선택
      const interestCount = 6;
      const randomInterests = allInterests
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(interestCount, allInterests.length))
        .map((interest) => interest.id);

      // 랜덤한 해시태그 6개 선택
      const hashtagCount = 6;
      const randomHashtags = allHashtags
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(hashtagCount, allHashtags.length))
        .map((hashtag) => hashtag.id);

      // 사용자 생성
      const user = userRepository.create({
        id: userId,
        phoneNumber,
        phoneVerifiedAt: new Date(),
        onboardingCompletedAt: new Date(),
        lastLoginAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(user);

      // 사용자 프로필 생성
      const profile = userProfileRepository.create({
        userId,
        nickname,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
        bio: `안녕하세요! 새로운 사람들과 함께 재미있는 활동을 해보고 싶어요!`,
        birthYear: Math.floor(Math.random() * 25) + 1990, // 1990-2014
        gender: getRandomGender(),
        mbti: mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)],
        interestIds: randomInterests,
        hashtagIds: randomHashtags,
        districtId: activeSongpaDistrict.id,
        points: Math.floor(Math.random() * 2000),
      });
      await userProfileRepository.save(profile);

      // 사용자 보상 생성
      const rewards = userRewardsRepository.create({
        userId,
        aiMissionTickets: Math.floor(Math.random() * 5),
      });
      await userRewardsRepository.save(rewards);
    }
  }

  // 모든 미션과 사용자 가져오기
  const missions = await missionRepository
    .createQueryBuilder('mission')
    .where('mission.isActive = :isActive', { isActive: true })
    .getMany();

  // 참가자 테스트 계정 ID 찾기
  const participantTestId = (
    await userRepository.findOne({
      where: { phoneNumber: '01011112222' },
    })
  )?.id;

  const testAccountId = (
    await userRepository.findOne({
      where: { phoneNumber: '01012345678' },
    })
  )?.id;

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  if (!participantTestId || !testAccountId || missions.length === 0) {
    logger.warn(
      '테스트 계정 또는 미션이 부족하여 간단한 모임 데이터를 건너뜁니다.',
    );
  } else {
    // 간단한 ACTIVE 모임 1개만 생성 (테스트계정이 호스트, 참가자테스트계정이 참가자)
    const meetingId = ulid();

    // 1. 모임 생성
    const meeting = meetingRepository.create({
      id: meetingId,
      hostUserId: testAccountId,
      missionId: missions[0].id,
      scheduledAt: new Date(Date.now() - 10 * 1000), // TODO: 테스트용 10초 전 시작
      recruitUntil: new Date(Date.now() - 60 * 60 * 1000), // 1시간 전 마감
      status: MeetingStatus.ACTIVE,
      maxParticipants: 4,
      minimumParticipants: 2,
      requiredPoints: 1000,
      rewardPoints: 1000,
      introduction: '테스트용 ACTIVE 모임입니다',
      focusScore: 85,
    });
    await meetingRepository.save(meeting);

    // 2. 모임 프로필 생성
    await queryRunner.query(
      `
      INSERT INTO meeting_profiles ("meetingId", introduction, "focusScore", "hostStake", "participantStake")
      VALUES ($1, $2, $3, $4, $5)
    `,
      [meetingId, '테스트용 모임 프로필입니다', 85, 2000, 1000],
    );

    // 3. 호스트 참가자 등록 (테스트계정)
    await participantRepository.save({
      meetingId,
      userId: testAccountId,
      isHost: true,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 2000,
      paymentTransactionId: ulid(),
    });

    // 4. 참가자 등록 (참가자테스트계정)
    await participantRepository.save({
      meetingId,
      userId: participantTestId,
      isHost: false,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 1000,
      paymentTransactionId: ulid(),
    });

    // 5. 출석 기록은 생성하지 않음 (출석체크 하기 전 상태)

    logger.info(
      '✅ 간단한 테스트 모임 생성 완료 (호스트: 테스트계정, 참가자: 참가자테스트계정)',
    );
  }

  // queryRunner 정리
  await queryRunner.release();

  logger.info('🌱 Initial data seeding has been completed.');
};
