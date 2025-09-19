import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { ulid } from 'ulid';
import { User, Meeting, MeetingLike } from '../../../entities';

export const seedMeetingLikes = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const userRepository = dataSource.getRepository(User);
  const meetingRepository = dataSource.getRepository(Meeting);
  const meetingLikeRepository = dataSource.getRepository(MeetingLike);

  // 모든 사용자와 모임 가져오기
  const users = await userRepository.find();
  const meetings = await meetingRepository.find();

  if (users.length === 0 || meetings.length === 0) {
    logger.warn('사용자 또는 모임이 없어 좋아요 데이터 생성을 건너뜁니다.');
    return;
  }

  logger.info('모임 좋아요 데이터 생성 시작...');

  let totalLikes = 0;

  // 각 모임에 대해 랜덤하게 좋아요 생성
  for (const meeting of meetings) {
    // 각 모임당 1-8개의 좋아요 랜덤 생성
    const likeCount = Math.floor(Math.random() * 8) + 1;
    
    // 사용자들을 랜덤하게 섞어서 선택
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const selectedUsers = shuffledUsers.slice(0, Math.min(likeCount, users.length));

    for (const user of selectedUsers) {
      // 이미 좋아요가 있는지 확인
      const existingLike = await meetingLikeRepository.findOne({
        where: { meetingId: meeting.id, userId: user.id }
      });

      if (!existingLike) {
        const meetingLike = meetingLikeRepository.create({
          id: ulid(),
          meetingId: meeting.id,
          userId: user.id,
        });

        await meetingLikeRepository.save(meetingLike);
        totalLikes++;
      }
    }

    // 진행률 로그
    if (totalLikes % 10 === 0) {
      logger.info(`모임 좋아요 생성 중... (${totalLikes}개 생성됨)`);
    }
  }

  logger.info(`✅ 모임 좋아요 데이터 생성 완료 (총 ${totalLikes}개)`);
};