import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PointTransaction,
  PointTransactionType,
  PointTransactionStatus,
  User,
  UserProfile,
  Meeting,
  MeetingParticipant,
  ParticipantStatus,
} from '../../entities';
import { MeetingNotificationHelper } from '../notification/helpers/meeting-notification.helper';

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);

  constructor(
    @InjectRepository(PointTransaction)
    private readonly pointTransactionRepository: Repository<PointTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
    private readonly dataSource: DataSource,
    private readonly meetingNotificationHelper: MeetingNotificationHelper,
  ) {}

  /**
   * 모임 참여 시 포인트 차감
   */
  async chargePointsForMeeting(
    userId: string,
    meetingId: string,
    amount: number,
  ): Promise<PointTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 사용자 프로필 조회
      const userProfile = await manager.findOne(UserProfile, {
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
      }

      // 포인트 부족 확인
      if (userProfile.points < amount) {
        throw new BadRequestException(
          `포인트가 부족합니다. 현재 ${userProfile.points}P, 필요 ${amount}P`,
        );
      }

      // 중복 결제 확인 (현재 참여 중인 경우만)
      const currentParticipant = await manager.findOne(MeetingParticipant, {
        where: {
          userId,
          meetingId,
          status: ParticipantStatus.JOINED,
        },
      });

      if (currentParticipant && currentParticipant.pointsPaid) {
        throw new BadRequestException('이미 결제가 완료된 모임입니다.');
      }

      const balanceBefore = userProfile.points;
      const balanceAfter = balanceBefore - amount;

      // 포인트 차감
      await manager.update(UserProfile, { userId }, { points: balanceAfter });

      // 트랜잭션 기록 생성
      const transaction = manager.create(PointTransaction, {
        userId,
        meetingId,
        type: PointTransactionType.MEETING_PAYMENT,
        status: PointTransactionStatus.COMPLETED,
        amount: -amount, // 차감이므로 음수
        balanceBefore,
        balanceAfter,
        description: '모임 참여비 결제',
      });

      const savedTransaction = await manager.save(transaction);

      // 참여자 정보 업데이트
      await manager.update(
        MeetingParticipant,
        { userId, meetingId },
        {
          pointsPaid: true,
          paidAmount: amount,
          paymentTransactionId: savedTransaction.id,
        },
      );

      this.logger.log(
        `Points charged: userId=${userId}, meetingId=${meetingId}, amount=${amount}`,
      );

      // 포인트 차감 알림 발송 (비동기)
      setImmediate(async () => {
        try {
          await this.meetingNotificationHelper.notifyPointDeducted(
            userId,
            amount,
            '모임 참여비 결제',
            meetingId,
          );
        } catch (error) {
          this.logger.error(
            'Failed to send point deduction notification:',
            error,
          );
        }
      });

      return savedTransaction;
    });
  }

  /**
   * 모임 완료 시 포인트 지급
   */
  async rewardPointsForCompletion(
    userId: string,
    meetingId: string,
    amount: number,
  ): Promise<PointTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 사용자 프로필 조회
      const userProfile = await manager.findOne(UserProfile, {
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
      }

      // 중복 지급 확인
      const existingReward = await manager.findOne(PointTransaction, {
        where: {
          userId,
          meetingId,
          type: PointTransactionType.MEETING_REWARD,
          status: PointTransactionStatus.COMPLETED,
        },
      });

      if (existingReward) {
        throw new BadRequestException('이미 보상이 지급된 모임입니다.');
      }

      const balanceBefore = userProfile.points;
      const balanceAfter = balanceBefore + amount;

      // 포인트 지급
      await manager.update(UserProfile, { userId }, { points: balanceAfter });

      // 트랜잭션 기록 생성
      const transaction = manager.create(PointTransaction, {
        userId,
        meetingId,
        type: PointTransactionType.MEETING_REWARD,
        status: PointTransactionStatus.COMPLETED,
        amount: amount, // 지급이므로 양수
        balanceBefore,
        balanceAfter,
        description: '모임 완료 보상',
      });

      const savedTransaction = await manager.save(transaction);

      // 참여자 정보 업데이트
      await manager.update(
        MeetingParticipant,
        { userId, meetingId },
        {
          rewardReceived: true,
          rewardTransactionId: savedTransaction.id,
        },
      );

      this.logger.log(
        `Points rewarded: userId=${userId}, meetingId=${meetingId}, amount=${amount}`,
      );

      // 포인트 지급 알림 발송 (비동기)
      setImmediate(async () => {
        try {
          await this.meetingNotificationHelper.notifyPointEarned(
            userId,
            amount,
            '모임 완료 보상',
            meetingId,
          );
        } catch (error) {
          this.logger.error('Failed to send point reward notification:', error);
        }
      });

      return savedTransaction;
    });
  }

  /**
   * 모임 취소 시 포인트 환불
   */
  async refundPointsForCancellation(
    userId: string,
    meetingId: string,
    amount: number,
    reason: string,
  ): Promise<PointTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 사용자 프로필 조회
      const userProfile = await manager.findOne(UserProfile, {
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
      }

      // 원본 결제 트랜잭션 확인
      const originalPayment = await manager.findOne(PointTransaction, {
        where: {
          userId,
          meetingId,
          type: PointTransactionType.MEETING_PAYMENT,
          status: PointTransactionStatus.COMPLETED,
        },
      });

      if (!originalPayment) {
        throw new BadRequestException('환불할 결제 내역을 찾을 수 없습니다.');
      }

      const balanceBefore = userProfile.points;
      const balanceAfter = balanceBefore + amount;

      // 포인트 환불
      await manager.update(UserProfile, { userId }, { points: balanceAfter });

      // 트랜잭션 기록 생성
      const transaction = manager.create(PointTransaction, {
        userId,
        meetingId,
        type: PointTransactionType.MEETING_REFUND,
        status: PointTransactionStatus.COMPLETED,
        amount: amount, // 환불이므로 양수
        balanceBefore,
        balanceAfter,
        description: `모임 취소 환불: ${reason}`,
        metadata: {
          originalTransactionId: originalPayment.id,
          refundReason: reason,
        },
      });

      const savedTransaction = await manager.save(transaction);

      this.logger.log(
        `Points refunded: userId=${userId}, meetingId=${meetingId}, amount=${amount}, reason=${reason}`,
      );

      return savedTransaction;
    });
  }

  /**
   * 노쇼 패널티 부과
   */
  async applyNoShowPenalty(
    userId: string,
    meetingId: string,
    penaltyAmount: number,
  ): Promise<PointTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 사용자 프로필 조회
      const userProfile = await manager.findOne(UserProfile, {
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
      }

      const balanceBefore = userProfile.points;
      const balanceAfter = Math.max(0, balanceBefore - penaltyAmount); // 0 미만으로 내려가지 않도록

      // 포인트 차감
      await manager.update(UserProfile, { userId }, { points: balanceAfter });

      // 트랜잭션 기록 생성
      const transaction = manager.create(PointTransaction, {
        userId,
        meetingId,
        type: PointTransactionType.NO_SHOW_PENALTY,
        status: PointTransactionStatus.COMPLETED,
        amount: -(balanceBefore - balanceAfter), // 실제 차감된 양 (음수)
        balanceBefore,
        balanceAfter,
        description: '노쇼 패널티',
        metadata: {
          requestedPenalty: penaltyAmount,
          actualPenalty: balanceBefore - balanceAfter,
        },
      });

      const savedTransaction = await manager.save(transaction);

      this.logger.log(
        `No-show penalty applied: userId=${userId}, meetingId=${meetingId}, penalty=${balanceBefore - balanceAfter}`,
      );

      // 포인트 차감 알림 발송 (비동기)
      setImmediate(async () => {
        try {
          const actualPenalty = balanceBefore - balanceAfter;
          await this.meetingNotificationHelper.notifyPointDeducted(
            userId,
            actualPenalty,
            '노쇼 패널티',
            meetingId,
          );
        } catch (error) {
          this.logger.error(
            'Failed to send no-show penalty notification:',
            error,
          );
        }
      });

      return savedTransaction;
    });
  }

  /**
   * 취소 패널티 부과
   */
  async applyCancellationPenalty(
    userId: string,
    meetingId: string,
    penaltyAmount: number,
    reason: string,
  ): Promise<PointTransaction> {
    return this.dataSource.transaction(async (manager) => {
      // 사용자 프로필 조회
      const userProfile = await manager.findOne(UserProfile, {
        where: { userId },
      });

      if (!userProfile) {
        throw new NotFoundException('사용자 프로필을 찾을 수 없습니다.');
      }

      const balanceBefore = userProfile.points;
      const balanceAfter = Math.max(0, balanceBefore - penaltyAmount); // 0 미만으로 내려가지 않도록

      // 포인트 차감
      await manager.update(UserProfile, { userId }, { points: balanceAfter });

      // 트랜잭션 기록 생성
      const transaction = manager.create(PointTransaction, {
        userId,
        meetingId,
        type: PointTransactionType.CANCELLATION_PENALTY,
        status: PointTransactionStatus.COMPLETED,
        amount: -(balanceBefore - balanceAfter), // 실제 차감된 양 (음수)
        balanceBefore,
        balanceAfter,
        description: `취소 패널티: ${reason}`,
        metadata: {
          requestedPenalty: penaltyAmount,
          actualPenalty: balanceBefore - balanceAfter,
          reason,
        },
      });

      const savedTransaction = await manager.save(transaction);

      this.logger.log(
        `Cancellation penalty applied: userId=${userId}, meetingId=${meetingId}, penalty=${balanceBefore - balanceAfter}`,
      );

      return savedTransaction;
    });
  }

  /**
   * 사용자 포인트 내역 조회
   */
  async getUserPointHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PointTransaction[]> {
    return this.pointTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['meeting', 'meeting.mission'],
    });
  }

  /**
   * 사용자 현재 포인트 조회
   */
  async getUserPoints(userId: string): Promise<number> {
    this.logger.log(`Getting points for user: ${userId}`);

    const userProfile = await this.userProfileRepository.findOne({
      where: { userId },
      select: ['points'],
    });

    if (!userProfile) {
      this.logger.warn(`User profile not found for user: ${userId}`);
      return 0;
    }

    this.logger.log(`User points: ${userProfile.points} for user: ${userId}`);
    return userProfile.points || 0;
  }
}
