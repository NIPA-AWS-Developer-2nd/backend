import { DataSource } from 'typeorm';
import * as winston from 'winston';
import {
  seedDistricts,
  seedCategories,
  seedLevels,
  seedUserPreferences,
  seedMissions,
  seedTestUsers,
  seedDummyUsers,
  seedSampleMeetings,
  seedGiftCards,
  seedActivityLogs,
  seedMeetingLikes,
} from './data';

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

  // 서울 구 데이터 시딩
  await seedDistricts(dataSource, logger);

  // 미션 카테고리 데이터 시딩
  await seedCategories(dataSource, logger);

  // 레벨 시스템 데이터 시딩
  await seedLevels(dataSource, logger);

  // 사용자 관심사 및 해시태그 데이터 시딩
  await seedUserPreferences(dataSource, logger);

  // 미션 데이터 시딩
  await seedMissions(dataSource, logger);

  // 테스트 계정들 생성
  await seedTestUsers(dataSource, logger);

  // 20명의 더미 사용자 생성
  await seedDummyUsers(dataSource, logger);

  // 샘플 모임 생성
  await seedSampleMeetings(dataSource, logger);

  // 기프티콘 데이터 시딩
  await seedGiftCards(dataSource.getRepository('GiftCard'));
  logger.info('🎁 Gift cards seeded');

  // 최근활동 데이터 시딩
  await seedActivityLogs(dataSource, logger);

  // 모임 좋아요 데이터 시딩
  await seedMeetingLikes(dataSource, logger);

  logger.info('🌱 Initial data seeding has been completed.');
};
