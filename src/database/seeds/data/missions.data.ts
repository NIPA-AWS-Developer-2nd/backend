import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { District, Category, Mission } from '../../../entities';
import { MissionDifficulty } from '../../../entities/mission.entity';

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
      '카페 내부에서 주문한 음료와 함께 셀피를 찍어주세요. 카페 간판이나 내부 인테리어가 배경에 포함되면 더 좋습니다.',
    sampleImageUrls: [
      'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
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
    description: '송파구 내 인기 맛집을 방문하고 인증 사진을 업로드해 주세요.',
    basePoints: 1000,
    estimatedDuration: 120,
    participants: 6,
    minimumDuration: 90,
    difficulty: MissionDifficulty.EASY,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.0.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    categorySlug: 'food',
    photoVerificationGuide:
      '맛집 내부에서 주문한 음식과 함께 사진을 찍어주세요. 가능하면 음식점 간판이나 메뉴판이 함께 나오면 좋습니다.',
    sampleImageUrls: [
      'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
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
    description: '송파구 내 박물관을 방문하고 전시품과 함께 사진을 촬영하세요.',
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
      '박물관 내부에서 전시품과 함께 사진을 찍어주세요. 박물관 입구나 안내판도 함께 찍으면 더 좋습니다. 플래시 사용이 금지된 곳에서는 주의하세요.',
    sampleImageUrls: [
      'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
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
    id: '01K2X11W2GZ5EVGP21P26KF47G',
    title: '센터필드 카공 인증: 상호 텍스트 + 노트북 3대',
    description:
      '송파구 소재 카페(센터필드 표기)에서 상호 텍스트 인증 후, 팀원들이 함께 카공하는 모습을 노트북 3대 이상으로 인증하는 2단계 미션입니다. 얼굴은 나오지 않게 촬영하세요.',
    basePoints: 1500,
    estimatedDuration: 40,
    participants: 3,
    minimumDuration: 20,
    difficulty: MissionDifficulty.VERY_EASY,
    thumbnailUrl:
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/thumbnail/test-cafestudy-001_1.jpg',
    categorySlug: 'cafe',
    photoVerificationGuide:
      '1단계: 컵홀더/메뉴/영수증 등에서 \'센터필드\' 텍스트가 읽히도록 근접 촬영(얼굴 미노출).\n2단계: 카페 테이블에서 노트북이 3대 이상 동시에 보이도록 프레이밍(얼굴/상반신 미노출).',
    sampleImageUrls: [
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/test-cafestudy-001_1.jpg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/test-cafestudy-001_2.jpeg',
    ],
    precautions: [
      '매장 및 다른 손님 동선 방해 금지',
      '얼굴 등 식별 정보가 프레임에 나오지 않도록 주의',
      '점내 촬영 허용 범위 준수',
    ],
  },
  {
    id: '01K2VWTMZETYZK5NAG592MX3ZH',
    title: '송파 전통시장 장보기',
    description: '송파구 가락시장에서 전통 먹거리를 구매하고 인증하는 미션이에요.',
    basePoints: 500,
    estimatedDuration: 80,
    participants: 4,
    minimumDuration: 40,
    difficulty: MissionDifficulty.EASY,
    thumbnailUrl:
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/thumbnail/c89cedcf-a1ac-487b-9c23-43137bde09da_1.jpeg',
    categorySlug: 'food',
    photoVerificationGuide:
      '시장 입구 간판 텍스트가 보이도록 촬영(손/소지품 중심, 얼굴 미노출)\n팀원 4명이 구매한 전통 먹거리를 들고 함께 촬영(손/소지품 중심, 얼굴 미노출)',
    sampleImageUrls: [
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/c89cedcf-a1ac-487b-9c23-43137bde09da_1.jpg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/c89cedcf-a1ac-487b-9c23-43137bde09da_2.jpg',
    ],
    precautions: [
      '다른 방문객들에게 방해가 되지 않도록 주의해주세요.',
      '상인분들께 예의를 지켜주세요.',
    ],
  },
  {
    id: '01K2VWTKP86C34W3EWPJD5YPFD',
    title: '석촌호수 생태 체험',
    description: '석촌호수 생태공원에서 반려견과 함께 자연을 즐기는 미션이에요.',
    basePoints: 500,
    estimatedDuration: 60,
    participants: 4,
    minimumDuration: 30,
    difficulty: MissionDifficulty.EASY,
    thumbnailUrl:
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/thumbnail/81c07b90-ab53-4cc4-8640-5ce643173d8a_1.png',
    categorySlug: 'culture',
    photoVerificationGuide:
      '호수 입구에 있는 안내판 텍스트가 보이도록 촬영(손/소지품 중심, 얼굴 미노출)\n팀원 4명과 반려견이 함께 산책하는 모습을 촬영(반려견과 핸드프린트만 나오도록, 얼굴 미노출)',
    sampleImageUrls: [
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/81c07b90-ab53-4cc4-8640-5ce643173d8a_2.jpeg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/81c07b90-ab53-4cc4-8640-5ce643173d8a_2.jpg',
    ],
    precautions: [
      '반려견 배변봉투와 목줄을 꼭 지참해주세요.',
      '다른 방문객들에게 방해가 되지 않도록 주의해주세요.',
    ],
  },
  {
    id: '01K2VWTMFZN00F4CNRASJVECNJ',
    title: '석촌호수 엄지척 챌린지',
    description: '석촌호수를 배경으로 4명이 함께 엄지척 포즈를 완성하는 미션이에요.',
    basePoints: 500,
    estimatedDuration: 30,
    participants: 4,
    minimumDuration: 15,
    difficulty: MissionDifficulty.EASY,
    thumbnailUrl:
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/thumbnail/test-seokchon-thumbsup-001_1.jpg',
    categorySlug: 'culture',
    photoVerificationGuide:
      '석촌호수 보이도록 촬영(얼굴 미노출).\n팀원 4명이 동시에 엄지척을 내밀고, 4개의 엄지가 모두 보이도록 촬영(손만 프레임).',
    sampleImageUrls: [
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/test-seokchon-thumbsup-001_1.jpg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/test-seokchon-thumbsup-001_2.jpg',
    ],
    precautions: [
      '주변 산책객에게 방해되지 않게 서서 촬영해주세요.',
      '얼굴은 나오지 않게, 손만 나오도록 주의해주세요.',
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
      '롯데월드 내부에서 어트랙션을 타는 모습이나 어트랙션 앞에서 단체 사진을 찍어주세요. 5개 이상의 어트랙션 인증샷이 필요합니다.',
    sampleImageUrls: [
      'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
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
      '한강공원에서 러닝 전후 사진과 러닝 앱 화면(거리, 시간 기록)을 캡처해서 인증해주세요. 5km 완주 기록이 필요합니다.',
    sampleImageUrls: [
      'https://nullisdefined.s3.ap-northeast-2.amazonaws.com/images/c960d452d01cce8aecc0cc8408cee9fc.png',
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
    id: '01K2VWTMX54MN0CFZDEEX5J2NT',
    title: '잠실 한강변 세 가지 색',
    description: '잠실 한강변에서 조깅, 자전거, 팀 포즈 세 가지를 인증하는 미션이에요.',
    basePoints: 500,
    estimatedDuration: 100,
    participants: 6,
    minimumDuration: 50,
    difficulty: MissionDifficulty.HARD,
    thumbnailUrl:
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/thumbnail/98b62638-6a47-48e8-83aa-900f3813bac8_1.jpeg',
    categorySlug: 'sports',
    photoVerificationGuide:
      '한강 조깅 코스 안내판 텍스트가 보이도록 촬영(손/소지품 중심, 얼굴 미노출)\n자전거 도로를 달리는 팀원들의 모습을 촬영(발/자전거 중심, 얼굴 미노출)\n팀원 6명이 삼각형 포즈를 취한 모습을 촬영(손/소지품 중심, 얼굴 미노출)',
    sampleImageUrls: [
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/98b62638-6a47-48e8-83aa-900f3813bac8_1.jpg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/98b62638-6a47-48e8-83aa-900f3813bac8_2.jpg',
      'https://halsaram-prompts.s3.ap-northeast-2.amazonaws.com/guides/98b62638-6a47-48e8-83aa-900f3813bac8_3.png',
    ],
    precautions: [
      '안전하게 활동해주세요.',
      '다른 방문객들에게 방해되지 않도록 주의해주세요.',
    ],
  },
];

export const seedMissions = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const districtRepository = dataSource.getRepository(District);
  const categoryRepository = dataSource.getRepository(Category);
  const missionRepository = dataSource.getRepository(Mission);

  const songpaDistrictForMissions = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  if (!songpaDistrictForMissions) {
    logger.error(
      '송파구 정보를 찾을 수 없습니다. 미션 시드 데이터를 건너뜁니다.',
    );
    return;
  }

  for (const mission of missionData) {
    const existingMission = await missionRepository.findOne({
      where: { id: mission.id },
    });

    if (existingMission) {
      continue;
    }

    const category = await categoryRepository.findOne({
      where: { slug: mission.categorySlug },
    });

    if (!category) {
      logger.warn(
        `카테고리 '${mission.categorySlug}'를 찾을 수 없어 미션 '${mission.title}'를 건너뜁니다.`,
      );
      continue;
    }

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
};
