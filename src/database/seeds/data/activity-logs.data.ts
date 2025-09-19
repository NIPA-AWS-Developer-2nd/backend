import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import { ActivityLog, ActivityType } from '../../../entities/activity-log.entity';
import { User } from '../../../entities/user.entity';
import { Meeting } from '../../../entities/meeting.entity';

export const seedActivityLogs = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const activityLogRepository = dataSource.getRepository(ActivityLog);
  const userRepository = dataSource.getRepository(User);
  const meetingRepository = dataSource.getRepository(Meeting);

  // 테스트계정1 찾기 (01012345678)
  const testUser1 = await userRepository.findOne({
    where: { phoneNumber: '01012345678' },
  });

  if (!testUser1) {
    logger.warn('테스트계정1을 찾을 수 없어 최근활동 시드를 건너뜁니다.');
    return;
  }

  // 다른 테스트 사용자들 찾기
  const testUser2 = await userRepository.findOne({
    where: { phoneNumber: '01011112222' },
  });

  const testUser3 = await userRepository.findOne({
    where: { phoneNumber: '01098765432' },
  });

  // 샘플 모임들 찾기 (mission 관계 포함)
  const meetings = await meetingRepository.find({
    relations: ['mission'],
    take: 5,
  });

  // 기존 활동 로그 삭제 (테스트계정1만)
  await activityLogRepository.delete({ userId: testUser1.id });

  const activityLogs: Partial<ActivityLog>[] = [];
  const now = new Date();

  // 1. 모임 생성 활동 (3일 전)
  if (meetings.length > 0) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_CREATED,
      meetingId: meetings[0].id,
      metadata: JSON.stringify({
        meetingTitle: meetings[0].mission?.title || 'Unknown Meeting',
        meetingDate: meetings[0].scheduledAt,
      }),
      isRead: true,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    });
  }

  // 2. 모임 참여 활동 (2일 전)
  if (meetings.length > 1) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_JOINED,
      meetingId: meetings[1].id,
      metadata: JSON.stringify({
        meetingTitle: meetings[1].mission?.title || 'Unknown Meeting',
        hostName: '활발한소영',
      }),
      isRead: true,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  // 3. 모임 좋아요 받음 (1일 전)
  if (meetings.length > 0 && testUser2) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_LIKED,
      meetingId: meetings[0].id,
      relatedUserId: testUser2.id,
      metadata: JSON.stringify({
        meetingTitle: meetings[0].mission?.title || 'Unknown Meeting',
        likedByNickname: '겁없는감자',
      }),
      isRead: true,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });
  }

  // 4. 모임 시작됨 (12시간 전)
  if (meetings.length > 2) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_STARTED,
      meetingId: meetings[2].id,
      metadata: JSON.stringify({
        meetingTitle: meetings[2].mission?.title || 'Unknown Meeting',
        location: '송파구',
      }),
      isRead: true,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    });
  }

  // 5. 모임 참여 활동 (6시간 전)
  if (meetings.length > 3) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_JOINED,
      meetingId: meetings[3].id,
      metadata: JSON.stringify({
        meetingTitle: meetings[3].mission?.title || 'Unknown Meeting',
        hostName: '즐거운토마토',
      }),
      isRead: false, // 새로운 알림
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    });
  }

  // 6. 모임 좋아요 받음 (3시간 전)
  if (meetings.length > 0 && testUser3) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_LIKED,
      meetingId: meetings[0].id,
      relatedUserId: testUser3.id,
      metadata: JSON.stringify({
        meetingTitle: meetings[0].mission?.title || 'Unknown Meeting',
        likedByNickname: '친절한바나나',
      }),
      isRead: false, // 새로운 알림
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    });
  }

  // 7. 모임 생성 활동 (1시간 전)
  if (meetings.length > 4) {
    activityLogs.push({
      id: ulid(),
      userId: testUser1.id,
      activityType: ActivityType.MEETING_CREATED,
      meetingId: meetings[4].id,
      metadata: JSON.stringify({
        meetingTitle: meetings[4].mission?.title || 'Unknown Meeting',
        meetingDate: meetings[4].scheduledAt,
        participantCount: 0,
      }),
      isRead: false, // 새로운 알림
      createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
    });
  }

  // 활동 로그 저장
  for (const log of activityLogs) {
    await activityLogRepository.save(activityLogRepository.create(log));
  }

  logger.info(`📝 테스트계정1의 최근활동 ${activityLogs.length}개 생성 완료`);
};