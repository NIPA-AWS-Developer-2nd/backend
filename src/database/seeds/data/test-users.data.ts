import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import * as starvingOrange from 'starving-orange';
import {
  District,
  UserInterests,
  UserHashtags,
  User,
  UserProfile,
  UserRewards,
} from '../../../entities';
import { UserStatus } from '../../../entities/user.entity';
import { Gender } from '../../../entities/user-profile.entity';

export const seedTestUsers = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const districtRepository = dataSource.getRepository(District);
  const userInterestsRepository = dataSource.getRepository(UserInterests);
  const userHashtagsRepository = dataSource.getRepository(UserHashtags);
  const userRepository = dataSource.getRepository(User);
  const userProfileRepository = dataSource.getRepository(UserProfile);
  const userRewardsRepository = dataSource.getRepository(UserRewards);

  const songpaDistrict = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  const allInterests = await userInterestsRepository.find();
  const allHashtags = await userHashtagsRepository.find();

  if (!songpaDistrict || allInterests.length < 6 || allHashtags.length < 6) {
    logger.warn('필수 데이터가 부족하여 테스트 사용자 생성을 건너뜁니다.');
    return;
  }

  // 호스트용 관심사와 해시태그 6개씩 선택
  const hostInterests = allInterests.slice(0, 6).map(interest => interest.id);
  const hostHashtags = allHashtags.slice(0, 6).map(hashtag => hashtag.id);

  // 참가자용 관심사와 해시태그 6개씩 선택 (다른 조합)
  const participantInterests = allInterests.slice(3, 9).map(interest => interest.id);
  const participantHashtags = allHashtags.slice(3, 9).map(hashtag => hashtag.id);

  const hostUserExists = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });

  if (!hostUserExists) {
    const hostUserId = ulid();

    const hostUser = userRepository.create({
      id: hostUserId,
      phoneNumber: '01012345678',
      phoneVerifiedAt: new Date(),
      onboardingCompletedAt: new Date(),
      lastLoginAt: new Date(),
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(hostUser);

    const hostProfile = userProfileRepository.create({
      userId: hostUserId,
      nickname: '무서운고구마',
      profileImageUrl:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=모임리더민준',
      bio: '안녕하세요! 새로운 사람들과 함께 재미있는 경험을 만들어가는 걸 좋아해요 😊 적극적으로 참여하는 분들과 함께 미션을 수행하고 싶어요!',
      birthYear: 1995,
      gender: Gender.MALE,
      mbti: 'ENFJ',
      interestIds: hostInterests,
      hashtagIds: hostHashtags,
      districtId: songpaDistrict.id,
      points: 15000,
    });
    await userProfileRepository.save(hostProfile);

    const hostRewards = userRewardsRepository.create({
      userId: hostUserId,
      aiMissionTickets: 3,
    });
    await userRewardsRepository.save(hostRewards);

    logger.info('호스트 테스트 계정 생성: 01012345678 (테스트계정)');
  }

  const existingParticipant = await userRepository.findOne({
    where: { phoneNumber: '01011112222' },
  });

  if (!existingParticipant) {
    const participantUserId = ulid();

    const participantUser = userRepository.create({
      id: participantUserId,
      phoneNumber: '01011112222',
      phoneVerifiedAt: new Date(),
      onboardingCompletedAt: new Date(),
      lastLoginAt: new Date(),
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(participantUser);

    const participantProfile = userProfileRepository.create({
      userId: participantUserId,
      nickname: '겁없는감자',
      profileImageUrl:
        'https://api.dicebear.com/7.x/avataaars/svg?seed=겁없는감자',
      bio: '새로운 경험과 사람들을 만나는 걸 좋아해요! 맛집 탐방과 문화체험에 관심이 많습니다. 함께 즐거운 시간 만들어요~',
      birthYear: 1998,
      gender: Gender.FEMALE,
      mbti: 'ENFP',
      interestIds: participantInterests,
      hashtagIds: participantHashtags,
      districtId: songpaDistrict.id,
      points: 12000,
    });
    await userProfileRepository.save(participantProfile);

    const participantRewards = userRewardsRepository.create({
      userId: participantUserId,
      aiMissionTickets: 2,
    });
    await userRewardsRepository.save(participantRewards);

    logger.info('참가자 테스트 계정 생성: 01011112222 (활발한소영)');
  }

  // 시연용 추가 참가자들 생성 (starving-orange로 랜덤 닉네임)
  const demoParticipantPhones = [
    '01098765432',
    '01087654321',
    '01076543210',
    '01065432109',
    '01054321098',
  ];

  const demoParticipantData = [
    { birthYear: 1996, gender: Gender.MALE, mbti: 'INFP', points: 8500 },
    { birthYear: 1994, gender: Gender.MALE, mbti: 'ESTP', points: 7200 },
    { birthYear: 1999, gender: Gender.FEMALE, mbti: 'ISFJ', points: 9100 },
    { birthYear: 1997, gender: Gender.MALE, mbti: 'ESFP', points: 6800 },
    { birthYear: 1993, gender: Gender.FEMALE, mbti: 'ISFP', points: 10200 },
  ];

  for (let i = 0; i < demoParticipantPhones.length; i++) {
    const phoneNumber = demoParticipantPhones[i];
    const participantData = demoParticipantData[i];

    const existingUser = await userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser) {
      continue;
    }

    const userId = ulid();
    const nicknameResult = starvingOrange.generateNickname({
      noSpacing: true,
    });
    const nickname = nicknameResult.nickname;

    // 각 시연용 참가자별로 다른 관심사와 해시태그 6개씩 선택
    const demoInterests = allInterests
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
      .map(interest => interest.id);
    const demoHashtags = allHashtags
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
      .map(hashtag => hashtag.id);

    const user = userRepository.create({
      id: userId,
      phoneNumber,
      phoneVerifiedAt: new Date(),
      onboardingCompletedAt: new Date(),
      lastLoginAt: new Date(),
      status: UserStatus.ACTIVE,
    });
    await userRepository.save(user);

    const profile = userProfileRepository.create({
      userId,
      nickname,
      profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
      bio: `안녕하세요! 새로운 사람들과 함께 재미있는 활동을 해보고 싶어요!`,
      birthYear: participantData.birthYear,
      gender: participantData.gender,
      mbti: participantData.mbti,
      interestIds: demoInterests,
      hashtagIds: demoHashtags,
      districtId: songpaDistrict.id,
      points: participantData.points,
    });
    await userProfileRepository.save(profile);

    const rewards = userRewardsRepository.create({
      userId,
      aiMissionTickets: 3,
    });
    await userRewardsRepository.save(rewards);

    logger.info(`시연용 참가자 생성: ${phoneNumber} (${nickname})`);
  }
};

export const seedDummyUsers = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const districtRepository = dataSource.getRepository(District);
  const userInterestsRepository = dataSource.getRepository(UserInterests);
  const userHashtagsRepository = dataSource.getRepository(UserHashtags);
  const userRepository = dataSource.getRepository(User);
  const userProfileRepository = dataSource.getRepository(UserProfile);
  const userRewardsRepository = dataSource.getRepository(UserRewards);

  const activeSongpaDistrict = await districtRepository.findOne({
    where: { districtName: '송파구', isActive: true },
  });

  const allInterests = await userInterestsRepository.find();
  const allHashtags = await userHashtagsRepository.find();

  if (
    !activeSongpaDistrict ||
    allInterests.length === 0 ||
    allHashtags.length === 0
  ) {
    logger.warn('필수 데이터가 부족하여 더미 사용자 생성을 건너뜁니다.');
    return;
  }

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

    const existingUser = await userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser) {
      continue;
    }

    const userId = ulid();
    const nicknameResult = starvingOrange.generateNickname({
      noSpacing: true,
    });
    const nickname = nicknameResult.nickname;

    const interestCount = 6;
    const randomInterests = allInterests
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(interestCount, allInterests.length))
      .map((interest) => interest.id);

    const hashtagCount = 6;
    const randomHashtags = allHashtags
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(hashtagCount, allHashtags.length))
      .map((hashtag) => hashtag.id);

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

    const profile = userProfileRepository.create({
      userId,
      nickname,
      profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
      bio: `안녕하세요! 새로운 사람들과 함께 재미있는 활동을 해보고 싶어요!`,
      birthYear: Math.floor(Math.random() * 25) + 1990,
      gender: getRandomGender(),
      mbti: mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)],
      interestIds: randomInterests,
      hashtagIds: randomHashtags,
      districtId: activeSongpaDistrict.id,
      points: Math.floor(Math.random() * 2000),
    });
    await userProfileRepository.save(profile);

    const rewards = userRewardsRepository.create({
      userId,
      aiMissionTickets: Math.floor(Math.random() * 5),
    });
    await userRewardsRepository.save(rewards);

    logger.info(`더미 사용자 생성: ${phoneNumber} (${nickname})`);
  }
};
