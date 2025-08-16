import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  Meeting,
  MeetingStatus,
  MeetingParticipant,
  ParticipantStatus,
} from '../../entities';
import { PointService } from '../point/point.service';

@Injectable()
export class MeetingSchedulerService {
  private readonly logger = new Logger(MeetingSchedulerService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
    private readonly pointService: PointService,
  ) {}

  /**
   * 상태 업데이트 간격: development에서는 10초마다, production에서는 1분마다 실행
   * - 모집 마감 시간 도달 시 정원 확인 후 READY 또는 CANCELED 전환
   * - 활동 시작 시간 도달 시 READY → ACTIVE 전환 및 QR 토큰 발급
   * - 활동 시작 + 30분 도달 시 미체크자 노쇼 처리
   * TODO: 테스트에서는 10분
   * - 활동 시작 + 12시간 도달 시 ACTIVE → COMPLETED 전환 및 정산
   * TODO: 테스트에서는 20분
   */
  @Cron(
    process.env.NODE_ENV === 'development'
      ? '*/10 * * * * *'
      : CronExpression.EVERY_MINUTE,
  )
  async updateMeetingStatuses(): Promise<void> {
    try {
      const now = new Date();
      this.logger.log('Meeting status update started');

      await this.processRecruitmentDeadlines(now);
      await this.processActivityStart(now);
      await this.processAttendanceDeadlines(now);
      await this.processActivityCompletion(now);

      this.logger.log('Meeting status update completed');
    } catch (error) {
      this.logger.error('Error updating meeting statuses:', error);
    }
  }

  /**
   * 1. 모집 마감 시각 작업: 정원 확인 후 READY 또는 CANCELED 전환
   */
  private async processRecruitmentDeadlines(now: Date): Promise<void> {
    const meetingsAtDeadline = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.RECRUITING,
        recruitUntil: LessThan(now),
      },
    });

    for (const meeting of meetingsAtDeadline) {
      const currentParticipants = await this.participantRepository.count({
        where: {
          meetingId: meeting.id,
          status: ParticipantStatus.JOINED,
        },
      });

      if (currentParticipants >= meeting.minimumParticipants) {
        // 정원 충족: RECRUITING → READY
        await this.meetingRepository.update(meeting.id, {
          status: MeetingStatus.READY,
        });
        this.logger.log(
          `Meeting ${meeting.id} moved to READY (${currentParticipants} participants)`,
        );
      } else {
        // 정원 미달: RECRUITING → CANCELED + 알림 + 환불 + 삭제 예약
        await this.cancelMeetingDueToInsufficientParticipants(meeting.id);
        this.logger.log(
          `Meeting ${meeting.id} canceled due to insufficient participants (${currentParticipants}/${meeting.minimumParticipants})`,
        );
      }
    }
  }

  /**
   * 2. 활동 시작 작업: READY → ACTIVE 전환 및 QR 토큰 발급
   */
  private async processActivityStart(now: Date): Promise<void> {
    const meetingsToStart = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.READY,
        scheduledAt: LessThan(now),
      },
    });

    for (const meeting of meetingsToStart) {
      // READY → ACTIVE 전환
      await this.meetingRepository.update(meeting.id, {
        status: MeetingStatus.ACTIVE,
      });

      // QR 코드 토큰 자동 발급 (만료 시간: +30분)
      const qrCodeToken = this.generateQRToken();
      await this.meetingRepository.update(meeting.id, {
        qrCodeToken,
        qrGeneratedAt: now,
      });

      this.logger.log(
        `Meeting ${meeting.id} started and QR token generated (expires at ${new Date(now.getTime() + 30 * 60 * 1000).toISOString()})`,
      );
    }
  }

  /**
   * 3. 출석체크 마감 작업: 활동 시작 + 30분 후 미체크자 노쇼 처리 (dev: 10분)
   */
  private async processAttendanceDeadlines(now: Date): Promise<void> {
    // TODO: 개발 환경 테스트용 10분 설정 - 나중에 1분 또는 적절한 시간으로 조정 필요
    const attendanceDeadlineMs =
      process.env.NODE_ENV === 'development' ? 10 * 60 * 1000 : 30 * 60 * 1000;
    const deadlineAgo = new Date(now.getTime() - attendanceDeadlineMs);

    const meetingsWithExpiredAttendance = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.ACTIVE,
        scheduledAt: LessThan(deadlineAgo),
      },
    });

    // QR 코드가 아직 있는 모임들만 필터링
    const meetingsToProcess = meetingsWithExpiredAttendance.filter(
      (meeting) => meeting.qrCodeToken !== null,
    );

    for (const meeting of meetingsToProcess) {
      // QR 코드 만료 처리
      await this.meetingRepository.update(meeting.id, {
        qrCodeToken: null,
        qrGeneratedAt: null,
      });

      // 미체크자 노쇼 처리 및 -200포인트 패널티
      await this.processNoShowParticipants(meeting.id);

      this.logger.log(
        `Meeting ${meeting.id} attendance deadline passed, no-show processing completed`,
      );
    }
  }

  /**
   * 4. 활동 완료 작업: 활동 시작 + 12시간 후 COMPLETED 전환 및 정산 (dev: 20분)
   */
  private async processActivityCompletion(now: Date): Promise<void> {
    // TODO: 개발 환경 테스트용 20분 설정 - 나중에 적절한 시간으로 조정 필요
    const completionDeadlineMs =
      process.env.NODE_ENV === 'development'
        ? 20 * 60 * 1000
        : 12 * 60 * 60 * 1000;
    const completionDeadlineAgo = new Date(
      now.getTime() - completionDeadlineMs,
    );

    const meetingsToComplete = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.ACTIVE,
        scheduledAt: LessThan(completionDeadlineAgo),
        isRewardsDistributed: false,
      },
      relations: ['mission'],
    });

    for (const meeting of meetingsToComplete) {
      await this.completeMeetingAndDistributeRewards(meeting);

      // 호스트 미션 완료 보상 (+200P) 지급
      await this.rewardHostForCompletion(meeting.hostUserId, meeting.id);
    }

    if (meetingsToComplete.length > 0) {
      this.logger.log(
        `${meetingsToComplete.length} meetings completed with rewards and host bonuses`,
      );
    }
  }

  /**
   * 5. 취소된 모임 삭제 작업: 취소된 다음날 23:59:59에 실제 삭제
   */
  @Cron('59 23 * * *') // 매일 23:59에 실행
  async deleteCancelledMeetings(): Promise<void> {
    try {
      this.logger.log('Processing deletion of cancelled meetings');

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 어제 취소된 모임들 조회
      const meetingsToDelete = await this.meetingRepository.find({
        where: {
          status: MeetingStatus.CANCELED,
          cancelledAt: LessThan(yesterday),
        },
      });

      for (const meeting of meetingsToDelete) {
        // 모임 완전 삭제 (참여자, 좋아요, 출석 등 모든 관련 데이터 삭제)
        await this.permanentlyDeleteMeeting(meeting.id);
      }

      if (meetingsToDelete.length > 0) {
        this.logger.log(
          `${meetingsToDelete.length} cancelled meetings permanently deleted`,
        );
      }
    } catch (error) {
      this.logger.error('Error deleting cancelled meetings:', error);
    }
  }

  /**
   * 최소 인원 미달로 모임 취소 (스케줄러 전용)
   */
  private async cancelMeetingDueToInsufficientParticipants(
    meetingId: string,
  ): Promise<void> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) return;

    const now = new Date();

    // 모임 상태를 취소로 변경
    await this.meetingRepository.update(meetingId, {
      status: MeetingStatus.CANCELED,
      cancelledAt: now,
      cancellationReason: `최소 인원(${meeting.minimumParticipants}명) 미달로 자동 취소`,
    });

    // 참여자들 상태 변경 및 전액 환불 처리
    await this.participantRepository.update(
      { meetingId },
      { status: ParticipantStatus.DROPPED },
    );

    // 전액 환불 처리 (정원 미달로 인한 취소는 페널티 없음)
    await this.refundAllParticipants(meetingId, '정원 미달로 인한 취소');

    this.logger.log(
      `Meeting ${meetingId} auto-cancelled due to insufficient participants with full refunds`,
    );
  }

  /**
   * 미체크자 노쇼 처리 및 -200포인트 패널티
   */
  private async processNoShowParticipants(meetingId: string): Promise<void> {
    // 참가자 중 출석체크하지 않은 사용자들 조회
    const participants = await this.participantRepository.find({
      where: { meetingId },
    });

    // 출석체크 데이터 조회
    const attendances = await this.meetingRepository.manager
      .getRepository('MeetingAttendance')
      .find({ where: { meetingId } });

    const checkedInUserIds = new Set(
      attendances
        .filter((att) => att.status === 'checked_in')
        .map((att) => att.userId),
    );

    // 미체크자 처리 (호스트 제외)
    const noShowUsers = participants
      .filter((p) => !p.isHost && !checkedInUserIds.has(p.userId))
      .map((p) => p.userId);

    for (const userId of noShowUsers) {
      // 노쇼 처리 및 -200포인트 패널티
      await this.applyNoShowPenalty(userId, meetingId);
    }

    this.logger.log(
      `Processed ${noShowUsers.length} no-show participants for meeting ${meetingId}`,
    );
  }

  /**
   * 호스트 미션 완료 보상 (+200P) 지급
   */
  private async rewardHostForCompletion(
    hostUserId: string,
    meetingId: string,
  ): Promise<void> {
    try {
      await this.pointService.rewardPointsForCompletion(
        hostUserId,
        meetingId,
        200, // 호스트 보상 고정 200P
      );

      this.logger.log(
        `Host ${hostUserId} rewarded 200 points for completing meeting ${meetingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to reward host ${hostUserId} for meeting ${meetingId}:`,
        error,
      );
    }
  }

  /**
   * QR 토큰 생성 헬퍼
   */
  private generateQRToken(): string {
    return require('ulid').ulid();
  }

  /**
   * 노쇼 패널티 적용 (-200P 및 인증 기능 제한)
   */
  private async applyNoShowPenalty(
    userId: string,
    meetingId: string,
  ): Promise<void> {
    try {
      // -200포인트 패널티 적용
      await this.pointService.applyNoShowPenalty(userId, meetingId, 200);

      // 노쇼 기록 생성
      await this.meetingRepository.manager
        .getRepository('MeetingAttendance')
        .save({
          id: require('ulid').ulid(),
          meetingId,
          userId,
          status: 'no_show',
          noShowMarkedAt: new Date(),
        });

      this.logger.log(
        `Applied no-show penalty (-200P) to user ${userId} for meeting ${meetingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to apply no-show penalty to user ${userId}:`,
        error,
      );
    }
  }

  /**
   * 모임 완전 삭제 (모든 관련 데이터 삭제)
   */
  private async permanentlyDeleteMeeting(meetingId: string): Promise<void> {
    try {
      // 관련 데이터 순차적 삭제
      await this.meetingRepository.manager.transaction(async (manager) => {
        // 1. 출석 데이터 삭제
        await manager.delete('MeetingAttendance', { meetingId });

        // 2. 좋아요 데이터 삭제
        await manager.delete('MeetingLike', { meetingId });

        // 3. 참여자 데이터 삭제
        await manager.delete('MeetingParticipant', { meetingId });

        // 4. 모임 프로필 삭제
        await manager.delete('MeetingProfile', { meetingId });

        // 5. 모임 삭제
        await manager.delete('Meeting', { id: meetingId });
      });

      this.logger.log(
        `Permanently deleted meeting ${meetingId} and all related data`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to permanently delete meeting ${meetingId}:`,
        error,
      );
    }
  }

  /**
   * 모든 참여자 환불 처리
   */
  private async refundAllParticipants(
    meetingId: string,
    reason: string,
  ): Promise<void> {
    const participants = await this.participantRepository.find({
      where: {
        meetingId,
        pointsPaid: true,
      },
    });

    for (const participant of participants) {
      if (participant.paidAmount && participant.paidAmount > 0) {
        try {
          await this.pointService.refundPointsForCancellation(
            participant.userId,
            meetingId,
            participant.paidAmount,
            reason,
          );
        } catch (error) {
          this.logger.error(
            `Failed to refund participant ${participant.userId}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * 모임 완료 및 보상 지급 처리
   */
  private async completeMeetingAndDistributeRewards(
    meeting: Meeting,
  ): Promise<void> {
    try {
      this.logger.log(
        `Completing meeting ${meeting.id} and distributing rewards`,
      );

      // 참여자 목록 조회 (JOINED 상태만)
      const participants = await this.participantRepository.find({
        where: {
          meetingId: meeting.id,
          status: ParticipantStatus.JOINED,
          pointsPaid: true, // 포인트를 지불한 참여자만
        },
      });

      const rewardAmount =
        meeting.rewardPoints || meeting.mission?.basePoints || 0;
      let successfulRewards = 0;
      let failedRewards = 0;

      // 각 참여자에게 보상 지급
      for (const participant of participants) {
        try {
          await this.pointService.rewardPointsForCompletion(
            participant.userId,
            meeting.id,
            rewardAmount,
          );
          successfulRewards++;

          // 참여자 정보에 보상 지급 완료 표시
          await this.participantRepository.update(
            { id: participant.id },
            { rewardReceived: true },
          );
        } catch (error) {
          this.logger.error(
            `Failed to distribute reward to participant ${participant.userId} for meeting ${meeting.id}:`,
            error,
          );
          failedRewards++;
        }
      }

      // 모임 상태를 COMPLETED로 변경하고 보상 지급 완료 표시
      await this.meetingRepository.update(meeting.id, {
        status: MeetingStatus.COMPLETED,
        isRewardsDistributed: true,
      });

      this.logger.log(
        `Meeting ${meeting.id} completed. Rewards distributed: ${successfulRewards} successful, ${failedRewards} failed`,
      );
    } catch (error) {
      this.logger.error(`Error completing meeting ${meeting.id}:`, error);
    }
  }

  /**
   * 환불 처리가 필요한 취소된 모임들 처리
   */
  @Cron('0 */5 * * *') // 5분마다 실행
  async processCancelledMeetingRefunds(): Promise<void> {
    try {
      this.logger.log('Processing refunds for cancelled meetings');

      // 취소되었지만 아직 환불 처리가 안된 모임들 조회
      const cancelledMeetings = await this.meetingRepository.find({
        where: {
          status: MeetingStatus.CANCELED,
          isRewardsDistributed: false, // 환불 처리가 안된 모임
        },
      });

      for (const meeting of cancelledMeetings) {
        await this.processCancelledMeetingRefund(meeting);
      }

      if (cancelledMeetings.length > 0) {
        this.logger.log(
          `Processed refunds for ${cancelledMeetings.length} cancelled meetings`,
        );
      }
    } catch (error) {
      this.logger.error('Error processing cancelled meeting refunds:', error);
    }
  }

  /**
   * 개별 취소된 모임의 환불 처리
   */
  private async processCancelledMeetingRefund(meeting: Meeting): Promise<void> {
    try {
      // 포인트를 지불한 참여자들 조회
      const paidParticipants = await this.participantRepository.find({
        where: {
          meetingId: meeting.id,
          pointsPaid: true,
          rewardReceived: false, // 아직 환불받지 않은 참여자
        },
      });

      let successfulRefunds = 0;
      let failedRefunds = 0;

      for (const participant of paidParticipants) {
        try {
          if (participant.paidAmount && participant.paidAmount > 0) {
            await this.pointService.refundPointsForCancellation(
              participant.userId,
              meeting.id,
              participant.paidAmount,
              meeting.cancellationReason || '모임 취소로 인한 환불',
            );

            // 환불 완료 표시
            await this.participantRepository.update(
              { id: participant.id },
              { rewardReceived: true }, // 환불도 rewardReceived로 표시
            );

            successfulRefunds++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to refund participant ${participant.userId} for cancelled meeting ${meeting.id}:`,
            error,
          );
          failedRefunds++;
        }
      }

      // 환불 처리 완료 표시
      await this.meetingRepository.update(meeting.id, {
        isRewardsDistributed: true, // 환불 처리 완료
      });

      this.logger.log(
        `Refunds processed for cancelled meeting ${meeting.id}: ${successfulRefunds} successful, ${failedRefunds} failed`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing refunds for cancelled meeting ${meeting.id}:`,
        error,
      );
    }
  }

  /**
   * 매일 자정에 실행되어 만료된 QR 코드 토큰 정리
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredQrTokens(): Promise<void> {
    try {
      this.logger.log('QR token cleanup started');

      // 24시간이 지난 QR 토큰들을 정리
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.meetingRepository
        .createQueryBuilder()
        .update(Meeting)
        .set({
          qrCodeToken: null,
          qrGeneratedAt: null,
        })
        .where('qrGeneratedAt IS NOT NULL')
        .andWhere('qrGeneratedAt <= :oneDayAgo', { oneDayAgo })
        .execute();

      if (result.affected && result.affected > 0) {
        this.logger.log(`${result.affected} expired QR tokens cleaned up`);
      }

      this.logger.log('QR token cleanup completed');
    } catch (error) {
      this.logger.error('Error cleaning up QR tokens:', error);
    }
  }

  /**
   * 수동으로 특정 모임의 상태를 업데이트하는 메서드
   */
  async updateMeetingStatus(meetingId: string): Promise<void> {
    try {
      const meeting = await this.meetingRepository.findOne({
        where: { id: meetingId },
      });

      if (!meeting) {
        this.logger.warn(`Meeting with id ${meetingId} not found`);
        return;
      }

      const now = new Date();
      let newStatus = meeting.status;

      // 상태 변경 로직
      if (
        meeting.status === MeetingStatus.RECRUITING &&
        meeting.recruitUntil <= now
      ) {
        newStatus = MeetingStatus.READY;
      } else if (
        meeting.status === MeetingStatus.READY &&
        meeting.scheduledAt <= now
      ) {
        newStatus = MeetingStatus.ACTIVE;
      } else if (meeting.status === MeetingStatus.ACTIVE) {
        // TODO: 개발 환경 테스트용 20분 설정 - 나중에 적절한 시간으로 조정 필요
        const completionMs =
          process.env.NODE_ENV === 'development'
            ? 20 * 60 * 1000
            : 12 * 60 * 60 * 1000;
        const completionTime = new Date(
          meeting.scheduledAt.getTime() + completionMs,
        );
        if (now >= completionTime) {
          newStatus = MeetingStatus.COMPLETED;
        }
      }

      if (newStatus !== meeting.status) {
        await this.meetingRepository.update(meetingId, { status: newStatus });
        this.logger.log(
          `Meeting ${meetingId} status updated from ${meeting.status} to ${newStatus}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error updating meeting ${meetingId} status:`, error);
    }
  }

  /**
   * 현재 모임의 실제 상태를 계산하는 헬퍼 메서드
   */
  calculateMeetingStatus(meeting: Meeting): MeetingStatus {
    const now = new Date();

    // 취소된 모임은 그대로 유지
    if (meeting.status === MeetingStatus.CANCELED) {
      return MeetingStatus.CANCELED;
    }

    // recruitUntil이나 scheduledAt이 없으면 기본 상태 반환
    if (!meeting.recruitUntil || !meeting.scheduledAt) {
      return meeting.status;
    }

    // 모집 마감 시간 확인
    if (now < meeting.recruitUntil) {
      return MeetingStatus.RECRUITING;
    }

    // 활동 시작 시간 확인
    if (now < meeting.scheduledAt) {
      return MeetingStatus.READY;
    }

    // 활동 시작 + 완료 시간 확인 (dev: 20분, prod: 12시간)
    // TODO: 개발 환경 테스트용 20분 설정 - 나중에 적절한 시간으로 조정 필요
    const completionMs =
      process.env.NODE_ENV === 'development'
        ? 20 * 60 * 1000
        : 12 * 60 * 60 * 1000;
    const completionTime = new Date(
      meeting.scheduledAt.getTime() + completionMs,
    );
    if (now >= completionTime) {
      return MeetingStatus.COMPLETED;
    }

    // 활동 시작 이후 ~ 12시간 사이는 ACTIVE
    return MeetingStatus.ACTIVE;
  }
}
