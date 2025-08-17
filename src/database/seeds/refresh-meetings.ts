import AppDataSource from '../../config/typeorm.config';
import * as winston from 'winston';
import { seedSampleMeetings } from './data/sample-meetings.data';

// 모임 관련 테이블만 초기화하는 스크립트
const refreshMeetingsOnly = async () => {
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

  try {
    logger.info('🔄 모임 데이터 초기화 시작...');

    // TypeORM 데이터 소스 초기화
    await AppDataSource.initialize();
    logger.info('✅ 데이터베이스 연결 성공');

    // 모임 관련 테이블만 삭제 (외래키 순서 고려)
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      logger.info('🗑️ 모임 관련 데이터 삭제 중...');

      // 외래키 제약 조건 무시 (PostgreSQL)
      await queryRunner.query('SET session_replication_role = replica;');

      // 모임 관련 테이블 삭제 (외래키 종속성 순서대로)
      await queryRunner.query('DELETE FROM meeting_chat_reads;');
      await queryRunner.query('DELETE FROM meeting_chats;');
      await queryRunner.query('DELETE FROM meeting_attendances;');
      await queryRunner.query('DELETE FROM meeting_likes;');
      await queryRunner.query('DELETE FROM meeting_participants;');
      await queryRunner.query('DELETE FROM meeting_profile_traits;');
      await queryRunner.query('DELETE FROM meeting_profiles;');
      await queryRunner.query('DELETE FROM meetings;');

      // 외래키 제약 조건 복원
      await queryRunner.query('SET session_replication_role = DEFAULT;');

      logger.info('✅ 모임 관련 데이터 삭제 완료');

      // ID 시퀀스 초기화 (필요한 경우)
      try {
        await queryRunner.query(
          'ALTER SEQUENCE IF EXISTS meetings_id_seq RESTART WITH 1;',
        );
        await queryRunner.query(
          'ALTER SEQUENCE IF EXISTS meeting_participants_id_seq RESTART WITH 1;',
        );
      } catch {
        // 시퀀스가 없는 경우 무시 (ULID 사용)
        logger.warn('시퀀스 초기화 건너뜀 (ULID 사용)');
      }

      // 새로운 모임 데이터 생성
      logger.info('📊 새로운 모임 데이터 생성 중...');
      await seedSampleMeetings(AppDataSource, logger);

      logger.info('🎉 모임 데이터 초기화 완료!');
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    logger.error('❌ 모임 데이터 초기화 실패:', error);
    throw error;
  } finally {
    // 데이터베이스 연결 종료
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('📊 데이터베이스 연결 종료');
    }
  }
};

// 스크립트 실행
if (require.main === module) {
  refreshMeetingsOnly()
    .then(() => {
      console.log('✅ 모임 데이터 초기화가 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 모임 데이터 초기화 중 오류가 발생했습니다:', error);
      process.exit(1);
    });
}
