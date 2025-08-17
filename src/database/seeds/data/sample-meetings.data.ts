import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import { User, Mission, Meeting, MeetingParticipant } from '../../../entities';
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

  const missions = await missionRepository
    .createQueryBuilder('mission')
    .where('mission.isActive = :isActive', { isActive: true })
    .getMany();

  // 미션 테이블의 첫 번째, 두 번째 미션 사용
  const firstMission = missions[0];
  const secondMission = missions[1];

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
        introduction:
          `🎯 ${firstMission.title} 함께 해요! 새로운 사람들과 즐거운 시간을 보내며 미션을 완수해봐요 ✨`,
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
        introduction:
          `🚀 ${secondMission.title} 도전하자! 함께 모여서 미션을 완성하고 새로운 경험을 만들어봐요 🎉`,
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
      [testMeetingId, `${secondMission.title} QR 코드 테스트를 위한 모임입니다`, 85, 2000, 1000],
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
  } finally {
    await queryRunner.release();
  }

  logger.info('🎭 시연용 모임 데이터 생성 완료');
};
