import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import { User, Mission, Meeting, MeetingParticipant, MissionReview } from '../../../entities';
import { MeetingStatus } from '../../../entities/meeting.entity';
import { ParticipantStatus } from '../../../entities/meeting-participant.entity';

export const seedSampleMeetings = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const userRepository = dataSource.getRepository(User);
  const missionRepository = dataSource.getRepository(Mission);
  const meetingRepository = dataSource.getRepository(Meeting);
  const participantRepository = dataSource.getRepository(MeetingParticipant);
  const missionReviewRepository = dataSource.getRepository(MissionReview);

  const missions = await missionRepository
    .createQueryBuilder('mission')
    .where('mission.isActive = :isActive', { isActive: true })
    .getMany();

  // 미션 테이블의 첫 번째 미션과 지정된 미션 사용
  const firstMission = missions[0];
  const secondMission = await missionRepository.findOne({
    where: { id: '01K2VWTMFZN00F4CNRASJVECNJ' }
  });

  if (!firstMission || !secondMission) {
    logger.warn(
      '미션이 부족하여 시연용 모임 생성을 건너뜁니다. (최소 2개 필요)',
    );
    return;
  }

  logger.info(`첫 번째 모임 미션: ${firstMission.title}`);
  logger.info(`두 번째 모임 미션: ${secondMission.title}`);

  // 시연용 사용자들 가져오기
  const hostUser = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });
  const participantUser = await userRepository.findOne({
    where: { phoneNumber: '01011112222' },
  });
  const additionalUsers = await userRepository.find({
    where: [
      { phoneNumber: '01098765432' },
      { phoneNumber: '01087654321' },
      { phoneNumber: '01076543210' },
      { phoneNumber: '01065432109' },
      { phoneNumber: '01054321098' },
    ],
  });

  if (!hostUser || !participantUser || additionalUsers.length < 3) {
    logger.warn('시연용 계정들이 부족하여 모임 생성을 건너뜁니다.');
    return;
  }

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const firstMeetingId = ulid();
    const cafeHostUser = additionalUsers.find(
      (u) => u.phoneNumber === '01076543210',
    );

    if (cafeHostUser) {
      const firstMeeting = meetingRepository.create({
        id: firstMeetingId,
        hostUserId: cafeHostUser.id,
        missionId: firstMission.id,
        scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2시간 후
        recruitUntil: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1시간 후 마감
        status: MeetingStatus.RECRUITING,
        maxParticipants: 4,
        minimumParticipants: 2,
        requiredPoints: 800,
        rewardPoints: 1200,
        introduction: `🎯 ${firstMission.title} 함께 해요! 새로운 사람들과 즐거운 시간을 보내며 미션을 완수해봐요 ✨`,
        focusScore: 78,
      });
      await meetingRepository.save(firstMeeting);

      await queryRunner.query(
        `INSERT INTO meeting_profiles ("meetingId", introduction, "focusScore", "hostStake", "participantStake")
         VALUES ($1, $2, $3, $4, $5)`,
        [
          firstMeetingId,
          `${firstMission.title}을 함께 즐기며 새로운 인연을 만들어가요! 적극적인 참여와 긍정적인 에너지로 함께해요 🌟`,
          78,
          1600,
          800,
        ],
      );

      // 호스트 참가
      await participantRepository.save({
        meetingId: firstMeetingId,
        userId: cafeHostUser.id,
        isHost: true,
        status: ParticipantStatus.JOINED,
        pointsPaid: true,
        paidAmount: 1600,
        paymentTransactionId: ulid(),
      });

      // 다른 참가자들 추가
      const firstMeetingParticipants = additionalUsers.filter(
        (u) =>
          u.phoneNumber &&
          ['01098765432', '01087654321'].includes(u.phoneNumber),
      );

      for (const participant of firstMeetingParticipants) {
        if (participant.id) {
          await participantRepository.save({
            meetingId: firstMeetingId,
            userId: participant.id,
            isHost: false,
            status: ParticipantStatus.JOINED,
            pointsPaid: true,
            paidAmount: 800,
            paymentTransactionId: ulid(),
          });
        }
      }

      logger.info('✅ 첫 번째 시연용 모임 생성 (카페 미션 - 나중에 나갈 모임)');
    }

    // 두 번째 모임: 맛집 미션 (최종 참여 모임)
    const secondMeetingId = ulid();
    const foodHostUser = additionalUsers.find(
      (u) => u.phoneNumber === '01065432109',
    ); // 맛집헌터태현이 호스트

    if (foodHostUser) {
      const secondMeeting = meetingRepository.create({
        id: secondMeetingId,
        hostUserId: foodHostUser.id,
        missionId: secondMission.id,
        scheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4시간 후 (시연에서 활동 시작할 시간)
        recruitUntil: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3시간 후 마감
        status: MeetingStatus.RECRUITING,
        maxParticipants: 6,
        minimumParticipants: 3,
        requiredPoints: 1000,
        rewardPoints: 1500,
        introduction: `🚀 ${secondMission.title} 도전하자! 함께 모여서 미션을 완성하고 새로운 경험을 만들어봐요 🎉`,
        focusScore: 92,
      });
      await meetingRepository.save(secondMeeting);

      await queryRunner.query(
        `INSERT INTO meeting_profiles ("meetingId", introduction, "focusScore", "hostStake", "participantStake")
         VALUES ($1, $2, $3, $4, $5)`,
        [
          secondMeetingId,
          `${secondMission.title} 전문가입니다! 함께 도전하며 성취감을 느껴봐요. 재미있는 대화와 좋은 추억 만들어요 💪`,
          92,
          2000,
          1000,
        ],
      );

      // 호스트 참가
      await participantRepository.save({
        meetingId: secondMeetingId,
        userId: foodHostUser.id,
        isHost: true,
        status: ParticipantStatus.JOINED,
        pointsPaid: true,
        paidAmount: 2000,
        paymentTransactionId: ulid(),
      });

      // 다른 참가자들 추가
      const secondMeetingParticipants = additionalUsers.filter(
        (u) =>
          u.phoneNumber &&
          ['01054321098', '01098765432'].includes(u.phoneNumber),
      );

      for (const participant of secondMeetingParticipants) {
        if (participant.id) {
          await participantRepository.save({
            meetingId: secondMeetingId,
            userId: participant.id,
            isHost: false,
            status: ParticipantStatus.JOINED,
            pointsPaid: true,
            paidAmount: 1000,
            paymentTransactionId: ulid(),
          });
        }
      }
    }

    const testMeetingId = ulid();
    const testMeeting = meetingRepository.create({
      id: testMeetingId,
      hostUserId: hostUser.id,
      missionId: secondMission.id,
      scheduledAt: new Date(Date.now() - 3 * 60 * 1000), // 3분 전에 시작 (출석체크 2분 남음, 활동 완료까지 7분 남음)
      recruitUntil: new Date(Date.now() - 30 * 60 * 1000), // 30분 전에 마감
      status: MeetingStatus.ACTIVE,
      maxParticipants: 4,
      minimumParticipants: 2,
      requiredPoints: 1000,
      rewardPoints: 1000,
      introduction: `${secondMission.title} - QR 코드 출석체크 및 인증 테스트용 모임입니다`,
      focusScore: 85,
    });
    await meetingRepository.save(testMeeting);

    await queryRunner.query(
      `INSERT INTO meeting_profiles ("meetingId", introduction, "focusScore", "hostStake", "participantStake")
       VALUES ($1, $2, $3, $4, $5)`,
      [
        testMeetingId,
        `${secondMission.title} QR 코드 테스트를 위한 모임입니다`,
        85,
        2000,
        1000,
      ],
    );

    // 호스트와 참가자 추가
    await participantRepository.save({
      meetingId: testMeetingId,
      userId: hostUser.id,
      isHost: true,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 2000,
      paymentTransactionId: ulid(),
    });

    await participantRepository.save({
      meetingId: testMeetingId,
      userId: participantUser.id,
      isHost: false,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 1000,
      paymentTransactionId: ulid(),
    });

    // QR 테스트 모임에 추가 참가자들 (더 풍성한 시연을 위해)
    const testMeetingAdditionalParticipants = additionalUsers.filter(
      (u) =>
        u.phoneNumber && ['01076543210', '01087654321'].includes(u.phoneNumber),
    );

    for (const participant of testMeetingAdditionalParticipants) {
      if (participant.id) {
        await participantRepository.save({
          meetingId: testMeetingId,
          userId: participant.id,
          isHost: false,
          status: ParticipantStatus.JOINED,
          pointsPaid: true,
          paidAmount: 1000,
          paymentTransactionId: ulid(),
        });
      }
    }

    logger.info('✅ QR 코드 테스트용 모임 생성 완료 (총 4명 참가)');

    // 활성 상태인 테스트 모임의 참가자들에 대해 mission_reviews 레코드 생성
    const testMeetingParticipants = await participantRepository.find({
      where: { meetingId: testMeetingId },
    });

    logger.info('📝 테스트 모임 참가자들의 mission_reviews 생성 중...');
    
    for (const participant of testMeetingParticipants) {
      // 기존 레코드가 있으면 삭제
      await missionReviewRepository.delete({
        meetingId: testMeetingId,
        userId: participant.userId 
      });

      // 새로 생성
      await missionReviewRepository.save({
        meetingId: testMeetingId,
        userId: participant.userId,
        reviewText: null,
        rating: null,
        photoUrls: [],
        earnedPoints: 0,
        pointCalculationDetails: null,
        verifiedAt: null,
      });
    }

    logger.info('✅ Mission reviews 레코드 생성 완료');

    // 테스트 계정 1의 과거 활동 내역 추가
    await createTestUserPastActivities(
      dataSource,
      missions,
      logger,
      userRepository,
      meetingRepository,
      participantRepository,
      missionReviewRepository,
      queryRunner,
    );

    // 더미 사용자들로만 구성된 추가 모임들 생성
    await createDummyUserMeetings(
      dataSource,
      missions,
      logger,
      userRepository,
      meetingRepository,
      participantRepository,
      queryRunner,
    );

  } finally {
    await queryRunner.release();
  }

  logger.info('🎭 시연용 모임 데이터 생성 완료');
};

// 더미 사용자들로만 구성된 추가 모임들 생성
const createDummyUserMeetings = async (
  dataSource: DataSource,
  missions: Mission[],
  logger: winston.Logger,
  userRepository: any,
  meetingRepository: any,
  participantRepository: any,
  queryRunner: any,
) => {
  // 더미 사용자들 가져오기 (테스트 계정 제외)
  const dummyUsers = await userRepository
    .createQueryBuilder('user')
    .where('user.phoneNumber NOT IN (:...testPhones)', {
      testPhones: [
        '01012345678',
        '01011112222',
        '01098765432',
        '01087654321',
        '01076543210',
        '01065432109',
        '01054321098',
      ],
    })
    .getMany();

  if (dummyUsers.length < 8) {
    logger.warn('더미 사용자가 부족하여 추가 모임 생성을 건너뜁니다.');
    return;
  }

  logger.info(`더미 사용자 ${dummyUsers.length}명으로 추가 모임 생성 시작`);

  // 미션별로 한 사용자가 여러 모임에 참여하지 않도록 관리
  const missionUserMap = new Map<string, Set<string>>();

  // 각 미션에 대해 여러 모임 생성 (총 15-20개 정도)
  const meetingConfigs = [
    // 카페 미션 모임들
    {
      missionIndex: 0, // 송파구 카페 방문
      maxParticipants: 6,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 6,
      recruitHoursFromNow: 5,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 0, // 송파구 카페 방문
      maxParticipants: 4,
      minimumParticipants: 2,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 8,
      recruitHoursFromNow: 7,
      status: MeetingStatus.RECRUITING,
    },
    // 맛집 미션 모임들
    {
      missionIndex: 1, // 송파구 맛집 방문하기
      maxParticipants: 6,
      minimumParticipants: 4,
      requiredPoints: 800,
      rewardPoints: 1200,
      scheduledHoursFromNow: 5,
      recruitHoursFromNow: 4,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 1, // 송파구 맛집 방문하기
      maxParticipants: 5,
      minimumParticipants: 3,
      requiredPoints: 800,
      rewardPoints: 1200,
      scheduledHoursFromNow: 12,
      recruitHoursFromNow: 10,
      status: MeetingStatus.RECRUITING,
    },
    // 박물관 미션 모임
    {
      missionIndex: 2, // 송파구 박물관 탐방
      maxParticipants: 6,
      minimumParticipants: 3,
      requiredPoints: 1200,
      rewardPoints: 1800,
      scheduledHoursFromNow: 24,
      recruitHoursFromNow: 20,
      status: MeetingStatus.RECRUITING,
    },
    // 센터필드 카공 미션 모임들
    {
      missionIndex: 3, // 센터필드 카공 인증
      maxParticipants: 3,
      minimumParticipants: 2,
      requiredPoints: 1200,
      rewardPoints: 1800,
      scheduledHoursFromNow: 7,
      recruitHoursFromNow: 6,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 3, // 센터필드 카공 인증
      maxParticipants: 3,
      minimumParticipants: 2,
      requiredPoints: 1200,
      rewardPoints: 1800,
      scheduledHoursFromNow: 14,
      recruitHoursFromNow: 12,
      status: MeetingStatus.RECRUITING,
    },
    // 전통시장 미션 모임
    {
      missionIndex: 4, // 송파 전통시장 장보기
      maxParticipants: 4,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 9,
      recruitHoursFromNow: 8,
      status: MeetingStatus.RECRUITING,
    },
    // 석촌호수 생태 체험 모임
    {
      missionIndex: 5, // 석촌호수 생태 체험
      maxParticipants: 4,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 18,
      recruitHoursFromNow: 16,
      status: MeetingStatus.RECRUITING,
    },
    // 석촌호수 엄지척 챌린지 모임
    {
      missionIndex: 6, // 석촌호수 엄지척 챌린지
      maxParticipants: 4,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 11,
      recruitHoursFromNow: 10,
      status: MeetingStatus.RECRUITING,
    },
    // 추가 번개모임들
    {
      missionIndex: 0, // 송파구 카페 방문
      maxParticipants: 3,
      minimumParticipants: 2,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 3,
      recruitHoursFromNow: 2,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 1, // 송파구 맛집 방문하기
      maxParticipants: 4,
      minimumParticipants: 2,
      requiredPoints: 800,
      rewardPoints: 1200,
      scheduledHoursFromNow: 6,
      recruitHoursFromNow: 5,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 2, // 송파구 박물관 탐방
      maxParticipants: 8,
      minimumParticipants: 4,
      requiredPoints: 1200,
      rewardPoints: 1800,
      scheduledHoursFromNow: 48,
      recruitHoursFromNow: 36,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 3, // 센터필드 카공 인증
      maxParticipants: 4,
      minimumParticipants: 2,
      requiredPoints: 1200,
      rewardPoints: 1800,
      scheduledHoursFromNow: 4,
      recruitHoursFromNow: 3,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 4, // 송파 전통시장 장보기
      maxParticipants: 5,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 15,
      recruitHoursFromNow: 13,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 5, // 석촌호수 생태 체험
      maxParticipants: 6,
      minimumParticipants: 4,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 20,
      recruitHoursFromNow: 18,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 0, // 송파구 카페 방문
      maxParticipants: 5,
      minimumParticipants: 3,
      requiredPoints: 400,
      rewardPoints: 600,
      scheduledHoursFromNow: 10,
      recruitHoursFromNow: 8,
      status: MeetingStatus.RECRUITING,
    },
    {
      missionIndex: 1, // 송파구 맛집 방문하기
      maxParticipants: 3,
      minimumParticipants: 2,
      requiredPoints: 800,
      rewardPoints: 1200,
      scheduledHoursFromNow: 2,
      recruitHoursFromNow: 1.5,
      status: MeetingStatus.RECRUITING,
    },
  ];

  // 더미 사용자들을 랜덤하게 섞기
  const shuffledUsers = [...dummyUsers].sort(() => 0.5 - Math.random());
  let userIndex = 0;

  for (let i = 0; i < meetingConfigs.length; i++) {
    const config = meetingConfigs[i];
    
    if (config.missionIndex >= missions.length) {
      logger.warn(`미션 인덱스 ${config.missionIndex}가 범위를 벗어났습니다.`);
      continue;
    }

    const mission = missions[config.missionIndex];
    const missionId = mission.id;

    // 이 미션에 대한 사용자 세트 초기화
    if (!missionUserMap.has(missionId)) {
      missionUserMap.set(missionId, new Set());
    }
    const usedUsersForMission = missionUserMap.get(missionId)!;

    // 이 모임을 위한 참가자들 선별 (이미 이 미션에 참여한 사용자는 제외)
    const availableUsers = shuffledUsers.filter(
      user => !usedUsersForMission.has(user.id)
    );

    if (availableUsers.length < config.minimumParticipants) {
      logger.warn(`미션 "${mission.title}"에 대한 가용 사용자가 부족합니다.`);
      continue;
    }

    // 참가자 수 결정 (최소 1자리는 비워두기)
    const participantCount = Math.min(
      config.maxParticipants - 1, // 최소 1자리는 비워두기
      Math.max(
        config.minimumParticipants,
        Math.floor(Math.random() * (config.maxParticipants - config.minimumParticipants + 1)) + config.minimumParticipants
      )
    );

    const selectedUsers = availableUsers.slice(0, participantCount);
    
    if (selectedUsers.length === 0) {
      continue;
    }

    // 호스트는 첫 번째 사용자
    const hostUser = selectedUsers[0];
    const participants = selectedUsers.slice(1);

    // 선택된 사용자들을 이 미션의 사용자 세트에 추가
    selectedUsers.forEach(user => usedUsersForMission.add(user.id));

    const meetingId = ulid();
    const meeting = meetingRepository.create({
      id: meetingId,
      hostUserId: hostUser.id,
      missionId: mission.id,
      scheduledAt: new Date(Date.now() + config.scheduledHoursFromNow * 60 * 60 * 1000),
      recruitUntil: new Date(Date.now() + config.recruitHoursFromNow * 60 * 60 * 1000),
      status: config.status,
      maxParticipants: config.maxParticipants,
      minimumParticipants: config.minimumParticipants,
      requiredPoints: config.requiredPoints,
      rewardPoints: config.rewardPoints,
      introduction: `🎯 ${mission.title} 함께 도전해요! 새로운 사람들과 즐거운 경험을 만들어봐요 ✨`,
      focusScore: Math.floor(Math.random() * 30) + 70, // 70-99 사이
    });
    await meetingRepository.save(meeting);

    // meeting_profiles 테이블에 추가
    await queryRunner.query(
      `INSERT INTO meeting_profiles ("meetingId", introduction, "focusScore", "hostStake", "participantStake")
       VALUES ($1, $2, $3, $4, $5)`,
      [
        meetingId,
        `${mission.title}을 함께 즐기며 새로운 인연을 만들어가요! 적극적인 참여와 긍정적인 에너지로 함께해요 🌟`,
        meeting.focusScore,
        config.rewardPoints,
        config.requiredPoints,
      ],
    );

    // 호스트 참가
    await participantRepository.save({
      meetingId,
      userId: hostUser.id,
      isHost: true,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: config.rewardPoints,
      paymentTransactionId: ulid(),
    });

    // 다른 참가자들 추가
    for (const participant of participants) {
      await participantRepository.save({
        meetingId,
        userId: participant.id,
        isHost: false,
        status: ParticipantStatus.JOINED,
        pointsPaid: true,
        paidAmount: config.requiredPoints,
        paymentTransactionId: ulid(),
      });
    }

    logger.info(
      `✅ 더미 사용자 모임 생성: "${mission.title}" (${selectedUsers.length}/${config.maxParticipants}명)`
    );
  }

  logger.info('✅ 더미 사용자 모임들 생성 완료');
};

// 테스트 계정 1의 과거 활동 내역 생성
const createTestUserPastActivities = async (
  dataSource: DataSource,
  missions: Mission[],
  logger: winston.Logger,
  userRepository: any,
  meetingRepository: any,
  participantRepository: any,
  missionReviewRepository: any,
  queryRunner: any,
) => {
  const testUser1 = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });

  if (!testUser1) {
    logger.warn('테스트 계정 1을 찾을 수 없어 과거 활동 생성을 건너뜁니다.');
    return;
  }

  // 더미 사용자들 가져오기
  const dummyUsers = await userRepository
    .createQueryBuilder('user')
    .where('user.phoneNumber NOT IN (:...testPhones)', {
      testPhones: [
        '01012345678',
        '01011112222',
        '01098765432',
        '01087654321',
        '01076543210',
        '01065432109',
        '01054321098',
      ],
    })
    .getMany();

  if (dummyUsers.length < 10) {
    logger.warn('더미 사용자가 부족하여 과거 활동 생성을 건너뜁니다.');
    return;
  }

  logger.info('테스트 계정 1의 과거 활동 내역 생성 시작...');

  // 과거 활동 1: 카페 미션 (완료됨, 1주일 전)
  const pastMeeting1Id = ulid();
  const pastMeeting1 = meetingRepository.create({
    id: pastMeeting1Id,
    hostUserId: dummyUsers[0].id,
    missionId: missions[0].id, // 카페 미션
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    recruitUntil: new Date(Date.now() - 7.5 * 24 * 60 * 60 * 1000),
    status: MeetingStatus.COMPLETED,
    maxParticipants: 4,
    minimumParticipants: 2,
    requiredPoints: 400,
    rewardPoints: 600,
    introduction: '카페에서 즐거운 시간 보내요!',
    focusScore: 85,
  });
  await meetingRepository.save(pastMeeting1);

  // 호스트 참가
  await participantRepository.save({
    meetingId: pastMeeting1Id,
    userId: dummyUsers[0].id,
    isHost: true,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 600,
    paymentTransactionId: ulid(),
  });

  // 테스트 계정 1 참가
  await participantRepository.save({
    meetingId: pastMeeting1Id,
    userId: testUser1.id,
    isHost: false,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 400,
    paymentTransactionId: ulid(),
  });

  // 다른 참가자들
  for (let i = 1; i < 3; i++) {
    await participantRepository.save({
      meetingId: pastMeeting1Id,
      userId: dummyUsers[i].id,
      isHost: false,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 400,
      paymentTransactionId: ulid(),
    });
  }

  // 리뷰 추가
  await missionReviewRepository.save({
    meetingId: pastMeeting1Id,
    userId: testUser1.id,
    reviewText: '정말 즐거운 시간이었어요! 호스트님이 너무 친절하시고 카페 분위기도 좋았습니다. 다음에 또 참여하고 싶어요!',
    rating: 5,
    photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    earnedPoints: 600,
    pointCalculationDetails: { basePoints: 400, bonusPoints: 200 },
    verifiedAt: new Date(Date.now() - 6.9 * 24 * 60 * 60 * 1000),
  });

  logger.info('✅ 과거 활동 1 생성 완료 (카페 미션)');

  // 과거 활동 2: 맛집 미션 (완료됨, 3일 전) - 테스트 계정 1이 호스트
  const pastMeeting2Id = ulid();
  const pastMeeting2 = meetingRepository.create({
    id: pastMeeting2Id,
    hostUserId: testUser1.id, // 테스트 계정 1이 호스트
    missionId: missions[1].id, // 맛집 미션
    scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    recruitUntil: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
    status: MeetingStatus.COMPLETED,
    maxParticipants: 5,
    minimumParticipants: 3,
    requiredPoints: 800,
    rewardPoints: 1200,
    introduction: '맛있는 음식 함께 먹어요!',
    focusScore: 90,
  });
  await meetingRepository.save(pastMeeting2);

  // 테스트 계정 1이 호스트
  await participantRepository.save({
    meetingId: pastMeeting2Id,
    userId: testUser1.id,
    isHost: true,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 1200,
    paymentTransactionId: ulid(),
  });

  // 참가자들
  for (let i = 3; i < 7; i++) {
    await participantRepository.save({
      meetingId: pastMeeting2Id,
      userId: dummyUsers[i].id,
      isHost: false,
      status: ParticipantStatus.JOINED,
      pointsPaid: true,
      paidAmount: 800,
      paymentTransactionId: ulid(),
    });

    // 참가자들의 리뷰
    await missionReviewRepository.save({
      meetingId: pastMeeting2Id,
      userId: dummyUsers[i].id,
      reviewText: `호스트님이 정말 잘 이끌어주셨어요! 맛집도 좋았고 분위기도 최고였습니다.`,
      rating: 4 + Math.floor(Math.random() * 2),
      photoUrls: [],
      earnedPoints: 1200,
      pointCalculationDetails: { basePoints: 800, bonusPoints: 400 },
      verifiedAt: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000),
    });
  }

  // 호스트 리뷰
  await missionReviewRepository.save({
    meetingId: pastMeeting2Id,
    userId: testUser1.id,
    reviewText: '멋진 사람들과 함께한 즐거운 식사였습니다. 모두 적극적으로 참여해주셔서 감사해요!',
    rating: 5,
    photoUrls: ['https://example.com/food1.jpg', 'https://example.com/food2.jpg', 'https://example.com/food3.jpg'],
    earnedPoints: 1800,
    pointCalculationDetails: { basePoints: 1200, bonusPoints: 600 },
    verifiedAt: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000),
  });

  logger.info('✅ 과거 활동 2 생성 완료 (맛집 미션 - 호스트)');

  // 과거 활동 3: 카공 미션 (완료됨, 10일 전)
  const pastMeeting3Id = ulid();
  const pastMeeting3 = meetingRepository.create({
    id: pastMeeting3Id,
    hostUserId: dummyUsers[7].id,
    missionId: missions[3].id, // 카공 미션
    scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    recruitUntil: new Date(Date.now() - 10.5 * 24 * 60 * 60 * 1000),
    status: MeetingStatus.COMPLETED,
    maxParticipants: 3,
    minimumParticipants: 2,
    requiredPoints: 1200,
    rewardPoints: 1800,
    introduction: '함께 집중해서 공부해요!',
    focusScore: 95,
  });
  await meetingRepository.save(pastMeeting3);

  // 호스트 참가
  await participantRepository.save({
    meetingId: pastMeeting3Id,
    userId: dummyUsers[7].id,
    isHost: true,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 1800,
    paymentTransactionId: ulid(),
  });

  // 테스트 계정 1 참가
  await participantRepository.save({
    meetingId: pastMeeting3Id,
    userId: testUser1.id,
    isHost: false,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 1200,
    paymentTransactionId: ulid(),
  });

  // 리뷰 추가
  await missionReviewRepository.save({
    meetingId: pastMeeting3Id,
    userId: testUser1.id,
    reviewText: '조용한 분위기에서 집중할 수 있어서 좋았어요. 서로 동기부여가 되는 시간이었습니다.',
    rating: 4,
    photoUrls: [],
    earnedPoints: 1800,
    pointCalculationDetails: { basePoints: 1200, bonusPoints: 600 },
    verifiedAt: new Date(Date.now() - 9.9 * 24 * 60 * 60 * 1000),
  });

  logger.info('✅ 과거 활동 3 생성 완료 (카공 미션)');

  // 과거 활동 4: 전통시장 미션 (완료됨, 2주일 전)
  const pastMeeting4Id = ulid();
  const pastMeeting4 = meetingRepository.create({
    id: pastMeeting4Id,
    hostUserId: dummyUsers[9].id,
    missionId: missions[4].id, // 전통시장 미션
    scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    recruitUntil: new Date(Date.now() - 14.5 * 24 * 60 * 60 * 1000),
    status: MeetingStatus.COMPLETED,
    maxParticipants: 4,
    minimumParticipants: 3,
    requiredPoints: 400,
    rewardPoints: 600,
    introduction: '전통시장 구경하며 장보기!',
    focusScore: 80,
  });
  await meetingRepository.save(pastMeeting4);

  // 호스트 참가
  await participantRepository.save({
    meetingId: pastMeeting4Id,
    userId: dummyUsers[9].id,
    isHost: true,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 600,
    paymentTransactionId: ulid(),
  });

  // 테스트 계정 1 참가
  await participantRepository.save({
    meetingId: pastMeeting4Id,
    userId: testUser1.id,
    isHost: false,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 400,
    paymentTransactionId: ulid(),
  });

  // 다른 참가자
  await participantRepository.save({
    meetingId: pastMeeting4Id,
    userId: dummyUsers[10].id,
    isHost: false,
    status: ParticipantStatus.JOINED,
    pointsPaid: true,
    paidAmount: 400,
    paymentTransactionId: ulid(),
  });

  // 리뷰 추가
  await missionReviewRepository.save({
    meetingId: pastMeeting4Id,
    userId: testUser1.id,
    reviewText: '전통시장의 정겨운 분위기를 느낄 수 있었어요. 시장 상인분들도 친절하시고 재미있는 경험이었습니다!',
    rating: 5,
    photoUrls: ['https://example.com/market1.jpg'],
    earnedPoints: 600,
    pointCalculationDetails: { basePoints: 400, bonusPoints: 200 },
    verifiedAt: new Date(Date.now() - 13.9 * 24 * 60 * 60 * 1000),
  });

  logger.info('✅ 과거 활동 4 생성 완료 (전통시장 미션)');

  logger.info('🎯 테스트 계정 1의 과거 활동 내역 생성 완료 (총 4개 모임 참여)');
};
