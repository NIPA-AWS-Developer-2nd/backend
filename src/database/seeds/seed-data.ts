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

  // 미션 데이터 시딩
  const missionData = [
    {
      id: '01JG9H7E2FQMC8GN1VKXR6W3T9',
      title: '송파구 맛집 방문하기',
      description:
        '송파구 내 인기 맛집을 방문하고 인증 사진을 업로드해 주세요.',
      basePoints: 500,
      estimatedDuration: 120,
      minParticipants: 4,
      maxParticipants: 6,
      minimumDuration: 90,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'food',
      photoVerificationGuide:
        '음식 사진, 메뉴판, 가게 외관, 함께 식사하는 모습을 촬영해주세요. 음식이 잘 보이도록 밝은 곳에서 촬영하면 좋습니다.',
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
      id: '01JG9H7E2GQMC8GN1VKXR6W3TA',
      title: '송파구 한강공원 러닝 5km 완주',
      description: '송파구 한강공원에서 5km 러닝을 완주하고 기록을 인증하세요.',
      basePoints: 800,
      estimatedDuration: 90,
      minParticipants: 4,
      maxParticipants: 8,
      minimumDuration: 60,
      difficulty: MissionDifficulty.MEDIUM,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1659242710553-3f8513f136b3?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'sports',
      photoVerificationGuide:
        '러닝 시작 전과 완주 후 사진을 촬영해주세요. 러닝 앱이나 스마트워치의 기록 화면도 함께 촬영하면 좋습니다. 5km 완주 인증을 위해 러닝 경로와 거리를 확인할 수 있는 사진이 필요합니다.',
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
    {
      id: '01JG9H7E2HQMC8GN1VKXR6W3TB',
      title: '송파구 롯데월드 어트랙션 체험',
      description:
        '송파구 롯데월드에서 5개 이상의 어트랙션을 체험하고 사진을 공유하세요.',
      basePoints: 1200,
      estimatedDuration: 240,
      minParticipants: 4,
      maxParticipants: 10,
      minimumDuration: 180,
      difficulty: MissionDifficulty.HARD,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1465996140498-df84be101126?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      categorySlug: 'culture',
      photoVerificationGuide:
        '각 어트랙션에서 탑승 전후 사진을 촬영해주세요. 어트랙션 이름이 보이는 안내판과 함께 인증샷을 찍어주시면 됩니다. 최소 5개 어트랙션에서 각각 1장씩 사진이 필요합니다.',
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
      id: '01JG9H7E2JQMC8GN1VKXR6W3TC',
      title: '송파구 카페 방문',
      description: '송파구의 특색있는 카페를 방문하고 음료와 함께 인증하세요.',
      basePoints: 350,
      estimatedDuration: 90,
      minParticipants: 4,
      maxParticipants: 6,
      minimumDuration: 60,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      categorySlug: 'cafe',
      photoVerificationGuide:
        '카페 외관, 내부 인테리어, 주문한 음료를 함께 촬영해주세요. 카페 이름이 보이는 메뉴판이나 로고도 함께 찍으면 좋습니다.',
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
      id: '01JG9H7E2KQMC8GN1VKXR6W3TD',
      title: '송파구 당구장 게임',
      description: '송파구 당구장에서 친구들과 함께 당구를 치며 즐기세요.',
      basePoints: 400,
      estimatedDuration: 120,
      minParticipants: 4,
      maxParticipants: 6,
      minimumDuration: 90,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      categorySlug: 'gaming',
      photoVerificationGuide:
        '당구대에서 게임하는 모습과 점수판을 촬영해주세요. 당구장 내부와 함께 게임을 즐기는 모습을 찍어주시면 됩니다.',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=400',
        'https://images.unsplash.com/photo-1611432579402-7037e11aa813?w=400',
      ],
      precautions: [
        '당구장 이용료는 개인 부담입니다',
        '초보자도 참여 가능하니 부담갖지 마세요',
        '당구큐 사용 시 안전에 주의하세요',
      ],
    },
    {
      id: '01JG9H7E2LQMC8GN1VKXR6W3TE',
      title: '송파구 박물관 탐방',
      description:
        '송파구 내 박물관을 방문하고 전시품과 함께 사진을 촬영하세요.',
      basePoints: 700,
      estimatedDuration: 180,
      minParticipants: 4,
      maxParticipants: 6,
      minimumDuration: 120,
      difficulty: MissionDifficulty.MEDIUM,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      categorySlug: 'culture',
      photoVerificationGuide:
        '박물관 외관, 주요 전시품, 박물관 내부 모습을 촬영해주세요. 전시품과 함께 인증샷을 찍을 때는 플래시 촬영 금지 안내문을 확인해주세요.',
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
      id: '01JG9H7E2MQMC8GN1VKXR6W3TF',
      title: '송파구 쇼핑몰 방문',
      description: '송파구 지역 쇼핑몰을 방문하고 쇼핑을 즐기세요.',
      basePoints: 400,
      estimatedDuration: 120,
      minParticipants: 4,
      maxParticipants: 8,
      minimumDuration: 90,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
      categorySlug: 'shopping',
      photoVerificationGuide:
        '쇼핑몰 외관, 내부 모습, 구매한 상품이나 쇼핑백을 촬영해주세요. 대형 쇼핑몰의 경우 랜드마크나 안내판과 함께 찍으면 좋습니다.',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400',
      ],
      precautions: [
        '쇼핑 비용은 개인 부담입니다',
        '주말이나 휴일에는 혼잡할 수 있습니다',
        '개인 소지품을 잘 챙기세요',
      ],
    },
    {
      id: '01JG9H7E2NQMC8GN1VKXR6W3TG',
      title: '송파구 쿠킹 클래스 체험',
      description:
        '송파구 요리 스튜디오에서 함께 요리를 배우고 완성품을 인증하세요.',
      basePoints: 800,
      estimatedDuration: 180,
      minParticipants: 4,
      maxParticipants: 8,
      minimumDuration: 120,
      difficulty: MissionDifficulty.MEDIUM,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      categorySlug: 'food',
      photoVerificationGuide:
        '요리 시작 전 준비된 재료, 요리 과정, 완성된 요리를 촬영해주세요. 함께 요리하는 모습과 완성품을 들었을 때의 기념샷도 찍어주시면 좋습니다.',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
        'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=400',
        'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400',
      ],
      precautions: [
        '쿠킹 클래스 비용은 개인 부담입니다',
        '사전 예약이 필요한 경우가 많으니 미리 확인하세요',
        '알레르기가 있는 경우 미리 알려주세요',
      ],
    },
    {
      id: '01JG9H7E2PQMC8GN1VKXR6W3TH',
      title: '송파구 한강공원 사진 촬영',
      description:
        '송파구 한강공원에서 일몰과 야경을 배경으로 인생샷을 촬영하세요.',
      basePoints: 650,
      estimatedDuration: 120,
      minParticipants: 4,
      maxParticipants: 6,
      minimumDuration: 90,
      difficulty: MissionDifficulty.EASY,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
      categorySlug: 'photo',
      photoVerificationGuide:
        '일출이 잘 보이는 위치에서 촬영해주세요. 한강과 일출이 함께 나오도록 구도를 잡으시면 됩니다. 최소 3장 이상의 사진이 필요하며, 시간대는 일출 전후 30분 이내여야 합니다.',
      sampleImageUrls: [
        'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      ],
      precautions: [
        '새벽 시간대이므로 안전에 주의하세요',
        '일출 시간을 미리 확인하고 30분 전에 도착하세요',
        '날씨가 좋지 않은 경우 연기될 수 있습니다',
      ],
    },
  ];

  // 송파구 district ID 찾기
  const songpaDistrict = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  if (!songpaDistrict) {
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
        minParticipants: mission.minParticipants,
        maxParticipants: mission.maxParticipants,
        minimumDuration: mission.minimumDuration,
        difficulty: mission.difficulty,
        thumbnailUrl: mission.thumbnailUrl,
        missionCategoryId: category.id,
        photoVerificationGuide: mission.photoVerificationGuide,
        sampleImageUrls: mission.sampleImageUrls,
        precautions: mission.precautions,
        districtId: songpaDistrict.id,
        isActive: true,
      });

      await missionRepository.save(newMission);
      logger.info(`미션 '${mission.title}' 시드 데이터가 생성되었습니다.`);
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

  // 20명의 더미 사용자 생성
  logger.info('👥 20명의 더미 사용자 생성 시작...');

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
      const nicknameResult = starvingOrange.generateNickname();
      const nickname = nicknameResult.nickname;

      // 랜덤한 관심사 2-4개 선택
      const interestCount = Math.floor(Math.random() * 3) + 2;
      const randomInterests = allInterests
        .sort(() => 0.5 - Math.random())
        .slice(0, interestCount)
        .map((interest) => interest.id);

      // 랜덤한 해시태그 1-3개 선택
      const hashtagCount = Math.floor(Math.random() * 3) + 1;
      const randomHashtags = allHashtags
        .sort(() => 0.5 - Math.random())
        .slice(0, hashtagCount)
        .map((hashtag) => hashtag.id);

      // 사용자 생성
      const user = userRepository.create({
        id: userId,
        phoneNumber,
        phoneVerifiedAt: new Date(),
        onboardingCompletedAt: new Date(),
        lastLoginAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ), // 지난 30일 내 랜덤
        status: UserStatus.ACTIVE,
      });
      await userRepository.save(user);

      // 사용자 프로필 생성
      const profile = userProfileRepository.create({
        userId,
        nickname,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
        bio: `안녕하세요! ${nickname}입니다. 새로운 사람들과 함께 재미있는 활동을 해보고 싶어요!`,
        birthYear: Math.floor(Math.random() * 25) + 1990, // 1990-2014
        gender: getRandomGender(),
        mbti: mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)],
        interestIds: randomInterests,
        hashtagIds: randomHashtags,
        districtId: activeSongpaDistrict.id,
        points: Math.floor(Math.random() * 2000), // 0-1999 포인트
      });
      await userProfileRepository.save(profile);

      // 사용자 보상 생성
      const rewards = userRewardsRepository.create({
        userId,
        aiMissionTickets: Math.floor(Math.random() * 5), // 0-4 티켓
      });
      await userRewardsRepository.save(rewards);
    }
  }

  // 이번 주 모임 더미데이터 생성
  const allMissions = await missionRepository.find({
    where: { isActive: true },
  });
  const allUsers = await userRepository.find({
    relations: ['profile'],
    where: { status: UserStatus.ACTIVE },
  });

  if (allMissions.length > 0 && allUsers.length > 0) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // 이번 주 월요일
    weekStart.setHours(0, 0, 0, 0);

    // 이번 주 각 날짜별로 1-3개의 모임 생성
    for (let day = 0; day < 7; day++) {
      const meetingDate = new Date(weekStart);
      meetingDate.setDate(weekStart.getDate() + day);

      // 과거 날짜는 건너뛰기
      if (meetingDate < now) {
        continue;
      }

      const meetingsToday = Math.floor(Math.random() * 3) + 1; // 1-3개

      for (let i = 0; i < meetingsToday; i++) {
        const mission =
          allMissions[Math.floor(Math.random() * allMissions.length)];
        const host = allUsers[Math.floor(Math.random() * allUsers.length)];

        // 모임 시작 시간 (10:00 ~ 20:00, 30분 단위)
        const startHour = Math.floor(Math.random() * 11) + 10; // 10-20시
        const startMinute = Math.random() < 0.5 ? 0 : 30; // 0분 또는 30분
        const scheduledAt = new Date(meetingDate);
        scheduledAt.setHours(startHour, startMinute, 0, 0);

        // 모집 마감시간 (모임 시작 2-24시간 전)
        const recruitHoursBefore = Math.floor(Math.random() * 23) + 2; // 2-24시간 전
        const recruitUntil = new Date(scheduledAt);
        recruitUntil.setHours(scheduledAt.getHours() - recruitHoursBefore);

        // 모임이 이미 모집 마감되었는지 확인
        const isRecruitmentClosed = recruitUntil < now;

        const meetingId = ulid();

        const meeting = meetingRepository.create({
          id: meetingId,
          missionId: mission.id,
          hostUserId: host.id,
          status: isRecruitmentClosed
            ? MeetingStatus.ACTIVE
            : MeetingStatus.RECRUITING,
          recruitUntil,
          scheduledAt,
          qrCodeToken: isRecruitmentClosed
            ? `qr_${ulid().substring(0, 10)}`
            : null,
          qrGeneratedAt: isRecruitmentClosed ? new Date() : null,
        });

        await meetingRepository.save(meeting);

        // 호스트를 참가자로 추가
        const hostParticipant = participantRepository.create({
          meetingId,
          userId: host.id,
          isHost: true,
          status: ParticipantStatus.JOINED,
          joinedAt: new Date(
            meeting.createdAt.getTime() + Math.random() * 60000,
          ), // 생성 후 1분 이내
        });
        await participantRepository.save(hostParticipant);

        // 추가 참가자들 (1-3명)
        const additionalParticipants = Math.floor(Math.random() * 3) + 1;
        const usedUsers = new Set([host.id]);

        for (
          let j = 0;
          j < additionalParticipants && usedUsers.size < allUsers.length;
          j++
        ) {
          let randomUser: (typeof allUsers)[0];
          do {
            randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
          } while (usedUsers.has(randomUser.id));

          usedUsers.add(randomUser.id);

          const participant = participantRepository.create({
            meetingId,
            userId: randomUser.id,
            isHost: false,
            status: ParticipantStatus.JOINED,
            joinedAt: new Date(
              meeting.createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000,
            ), // 24시간 이내
          });
          await participantRepository.save(participant);
        }
      }
    }
  }

  logger.info('🌱 Initial data seeding has been completed.');
};
