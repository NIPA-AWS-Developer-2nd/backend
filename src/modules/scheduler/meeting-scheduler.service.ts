import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { ulid } from 'ulid';
import {
  Meeting,
  MeetingStatus,
  MeetingParticipant,
  ParticipantStatus,
  MeetingAttendance,
  AttendanceStatus,
} from '../../entities';
import { MissionReview, VerificationStatus } from '../../entities/mission-review.entity';
import { PointService } from '../point/point.service';
import { MeetingNotificationHelper } from '../notification/helpers/meeting-notification.helper';

@Injectable()
export class MeetingSchedulerService {
  private readonly logger = new Logger(MeetingSchedulerService.name);

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingParticipant)
    private readonly participantRepository: Repository<MeetingParticipant>,
    @InjectRepository(MeetingAttendance)
    private readonly attendanceRepository: Repository<MeetingAttendance>,
    @InjectRepository(MissionReview)
    private readonly missionReviewRepository: Repository<MissionReview>,
    private readonly pointService: PointService,
    private readonly meetingNotificationHelper: MeetingNotificationHelper,
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

      await this.processRecruitmentWarnings(now);
      await this.processRecruitmentDeadlines(now);
      await this.processActivityReminders(now);
      await this.processActivityStart(now);
      await this.processAttendanceDeadlines(now);
      await this.processActivityCompletion(now);

      this.logger.log('Meeting status update completed');
    } catch (error) {
      this.logger.error('Error updating meeting statuses:', error);
    }
  }

  /**
   * 0. 모집 마감 경고: 1시간 전 알림
   */
  private async processRecruitmentWarnings(now: Date): Promise<void> {
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const meetingsNearDeadline = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.RECRUITING,
        recruitUntil: LessThan(oneHourLater),
      },
    });

    for (const meeting of meetingsNearDeadline) {
      // 마지막 경고 알림 시간 체크 (중복 방지)
      const lastWarningTime = meeting.lastWarningAt;
      const timeSinceLastWarning = lastWarningTime ? 
        (now.getTime() - lastWarningTime.getTime()) / 1000 / 60 : // 분 단위
        Infinity;

      // 1시간 이내에 경고를 보낸 적이 없으면 알림 발송
      if (timeSinceLastWarning > 60) {
        const timeRemaining = Math.ceil((meeting.recruitUntil.getTime() - now.getTime()) / 1000 / 60);
        
        if (timeRemaining > 0 && timeRemaining <= 60) {
          // 아직 참가 가능한 사용자들에게 알림 (전체 사용자 대상)
          // 실제로는 관심있는 사용자들에게만 보내는 것이 좋음
          const interestedUsers = ['sample-user-id']; // TODO: 실제 관심 사용자 조회 로직
          
          await this.meetingNotificationHelper.notifyRecruitmentDeadlineWarning(
            interestedUsers,
            {
              id: meeting.id,
            },
            `${timeRemaining}분`
          );

          // 마지막 경고 시간 업데이트
          await this.meetingRepository.update(meeting.id, {
            lastWarningAt: now,
          });

          this.logger.log(`Recruitment warning sent for meeting ${meeting.id} (${timeRemaining} minutes remaining)`);
        }
      }
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

      const participants = await this.participantRepository.find({
        where: {
          meetingId: meeting.id,
          status: ParticipantStatus.JOINED,
        },
        select: ['userId'],
      });
      const participantIds = participants.map(p => p.userId);

      if (currentParticipants >= meeting.minimumParticipants) {
        // 정원 충족: RECRUITING → READY
        await this.meetingRepository.update(meeting.id, {
          status: MeetingStatus.READY,
        });

        // 모집 마감 알림 발송 (참가자들에게)
        if (participantIds.length > 0) {
          await this.meetingNotificationHelper.notifyRecruitmentClosed(
            participantIds,
            {
              id: meeting.id,
            }
          );
        }

        this.logger.log(
          `Meeting ${meeting.id} moved to READY (${currentParticipants} participants)`,
        );
      } else {
        // 정원 미달: RECRUITING → CANCELED + 알림 + 환불 + 삭제 예약
        // 참가자들에게 취소 알림 발송
        if (participantIds.length > 0) {
          await this.meetingNotificationHelper.notifyRecruitmentClosed(
            participantIds,
            {
              id: meeting.id,
            }
          );
        }

        await this.cancelMeetingDueToInsufficientParticipants(meeting.id);
        this.logger.log(
          `Meeting ${meeting.id} canceled due to insufficient participants (${currentParticipants}/${meeting.minimumParticipants})`,
        );
      }
    }
  }

  /**
   * 1.5. 활동 시작 리마인더: 30분 전 알림
   */
  private async processActivityReminders(now: Date): Promise<void> {
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
    
    const meetingsStartingSoon = await this.meetingRepository.find({
      where: {
        status: MeetingStatus.READY,
        scheduledAt: LessThan(thirtyMinutesLater),
      },
    });

    for (const meeting of meetingsStartingSoon) {
      // 마지막 리마인더 시간 체크 (중복 방지)
      const lastReminderTime = meeting.lastReminderAt;
      const timeSinceLastReminder = lastReminderTime ? 
        (now.getTime() - lastReminderTime.getTime()) / 1000 / 60 : // 분 단위
        Infinity;

      // 1시간 이내에 리마인더를 보낸 적이 없으면 알림 발송
      if (timeSinceLastReminder > 60) {
        const timeRemaining = Math.ceil((meeting.scheduledAt.getTime() - now.getTime()) / 1000 / 60);
        
        if (timeRemaining > 0 && timeRemaining <= 30) {
          const participants = await this.participantRepository.find({
            where: {
              meetingId: meeting.id,
              status: ParticipantStatus.JOINED,
            },
            select: ['userId'],
          });
          
          if (participants.length > 0) {
            const participantIds = participants.map(p => p.userId);
            
            await this.meetingNotificationHelper.notifyActivityStartReminder(
              participantIds,
              {
                id: meeting.id,
              },
              `${timeRemaining}분`
            );

            // 마지막 리마인더 시간 업데이트
            await this.meetingRepository.update(meeting.id, {
              lastReminderAt: now,
            });

            this.logger.log(`Activity start reminder sent for meeting ${meeting.id} (${timeRemaining} minutes remaining)`);
          }
        }
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

      // 참가자들의 미션 리뷰 레코드 생성 (기본값: PENDING)
      await this.createInitialMissionReviews(meeting.id);

      // 활동 시작 알림 발송
      const participants = await this.participantRepository.find({
        where: {
          meetingId: meeting.id,
          status: ParticipantStatus.JOINED,
        },
        select: ['userId'],
      });
      
      if (participants.length > 0) {
        const participantIds = participants.map(p => p.userId);
        
        await this.meetingNotificationHelper.notifyActivityStarted(
          participantIds,
          {
            id: meeting.id,
          }
        );
      }

      this.logger.log(
        `Meeting ${meeting.id} started and QR token generated (expires at ${new Date(now.getTime() + 30 * 60 * 1000).toISOString()})`,
      );
    }
  }

  /**
   * 3. 출석체크 마감 작업: 활동 시작 + 5분 후 미체크자 노쇼 처리
   */
  private async processAttendanceDeadlines(now: Date): Promise<void> {
    // 출석체크 시간: 개발/운영 모두 5분
    const attendanceDeadlineMs = 5 * 60 * 1000; // 5분
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
   * 4. 활동 완료 작업: 활동 시작 + 10분 후 COMPLETED 전환 및 정산
   */
  private async processActivityCompletion(now: Date): Promise<void> {
    // 활동시간: 개발/운영 모두 10분
    const completionDeadlineMs = 10 * 60 * 1000; // 10분
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
    const attendances = await this.attendanceRepository.find({
      where: { meetingId },
    });

    const checkedInUserIds = new Set(
      attendances
        .filter((att) => att.status === AttendanceStatus.CHECKED_IN)
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
    return ulid();
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
      const attendance = this.attendanceRepository.create({
        id: ulid(),
        meetingId,
        userId,
        status: AttendanceStatus.NO_SHOW,
        noShowMarkedAt: new Date(),
      });
      await this.attendanceRepository.save(attendance);

      // 노쇼 알림 발송
      const meeting = await this.meetingRepository.findOne({
        where: { id: meetingId },
        select: ['id'],
      });

      if (meeting) {
        await this.meetingNotificationHelper.notifyNoShow(userId, {
          id: meeting.id,
        });
      }

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

      // 각 참여자에게 보상 지급 (미션 인증 완료자만)
      for (const participant of participants) {
        try {
          // 미션 인증 여부 확인
          const missionReview = await this.missionReviewRepository.findOne({
            where: {
              meetingId: meeting.id,
              userId: participant.userId,
            },
          });

          // 인증이 승인된 경우에만 포인트 지급
          if (missionReview && missionReview.aiVerificationStatus === VerificationStatus.APPROVED) {
            // 포인트 계산 (호스트 보너스, 중복 참여 페널티 적용)
            const calculatedPoints = await this.calculateRewardPoints(
              participant.userId,
              meeting,
              participant.isHost,
            );

            // 계산된 포인트를 mission_reviews에 저장
            await this.missionReviewRepository.update(
              { id: missionReview.id },
              {
                earnedPoints: calculatedPoints.finalPoints,
                pointCalculationDetails: calculatedPoints.details,
              },
            );

            // 포인트 지급
            await this.pointService.rewardPointsForCompletion(
              participant.userId,
              meeting.id,
              calculatedPoints.finalPoints,
            );
            successfulRewards++;

            // 참여자 정보에 보상 지급 완룉 표시
            await this.participantRepository.update(
              { id: participant.id },
              { rewardReceived: true },
            );
            
            this.logger.log(
              `Reward distributed to participant ${participant.userId} for meeting ${meeting.id} (${calculatedPoints.finalPoints} points)`,
            );
          } else {
            this.logger.warn(
              `Participant ${participant.userId} for meeting ${meeting.id} has no approved mission review. Reward not distributed.`,
            );
            failedRewards++;
          }
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

    // 활동 시작 + 완료 시간 확인: 10분
    const completionMs = 10 * 60 * 1000; // 10분
    const completionTime = new Date(
      meeting.scheduledAt.getTime() + completionMs,
    );
    if (now >= completionTime) {
      return MeetingStatus.COMPLETED;
    }

    // 활동 시작 이후 ~ 12시간 사이는 ACTIVE
    return MeetingStatus.ACTIVE;
  }

  /**
   * 모임 시작 시 참가자들의 미션 리뷰 레코드 생성
   */
  private async createInitialMissionReviews(meetingId: string): Promise<void> {
    try {
      // 모임 참가자 조회 (JOINED 상태만)
      const participants = await this.participantRepository.find({
        where: {
          meetingId,
          status: ParticipantStatus.JOINED,
        },
      });

      for (const participant of participants) {
        // 이미 리뷰가 있는지 확인
        const existingReview = await this.missionReviewRepository.findOne({
          where: {
            meetingId,
            userId: participant.userId,
          },
        });

        // 리뷰가 없으면 생성
        if (!existingReview) {
          const newReview = this.missionReviewRepository.create({
            meetingId,
            userId: participant.userId,
            reviewText: null,
            rating: null,
            photoUrls: [],
            aiVerificationStatus: VerificationStatus.PENDING,
            earnedPoints: 0,
            pointCalculationDetails: null,
            submittedAt: new Date(),
            verifiedAt: null,
          });

          await this.missionReviewRepository.save(newReview);
          
          this.logger.log(
            `Created initial mission review for user ${participant.userId} in meeting ${meetingId}`,
          );
        }
      }

      this.logger.log(
        `Initial mission reviews created for meeting ${meetingId} (${participants.length} participants)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create initial mission reviews for meeting ${meetingId}:`,
        error,
      );
    }
  }

  /**
   * 포인트 계산 로직 (호스트 보너스, 중복 참여 페널티 적용)
   */
  private async calculateRewardPoints(
    userId: string,
    meeting: Meeting,
    isHost: boolean,
  ): Promise<{
    finalPoints: number;
    details: any;
  }> {
    const basePoints = meeting.rewardPoints || meeting.mission?.basePoints || 0;
    let finalPoints = basePoints;
    const calculations: Array<{
      type: string;
      amount: number;
      description: string;
      details?: any;
    }> = [];

    // 1. 기본 포인트
    calculations.push({
      type: 'base',
      amount: basePoints,
      description: '기본 미션 완료 포인트',
    });

    // 2. 호스트 보너스 (+200P)
    if (isHost) {
      const hostBonus = 200;
      finalPoints += hostBonus;
      calculations.push({
        type: 'host_bonus',
        amount: hostBonus,
        description: '호스트 보너스',
      });
    }

    // 3. 중복 참여 페널티 (-50%)
    const duplicateParticipants = await this.checkDuplicateParticipants(
      userId,
      meeting.id,
    );
    
    if (duplicateParticipants.length > 0) {
      const penaltyAmount = Math.floor(finalPoints * 0.5);
      finalPoints = Math.floor(finalPoints * 0.5);
      calculations.push({
        type: 'duplicate_penalty',
        amount: -penaltyAmount,
        description: '중복 참여 페널티 (-50%)',
        details: {
          duplicateUserIds: duplicateParticipants,
          duplicateCount: duplicateParticipants.length,
        },
      });
    }

    const details = {
      basePoints,
      finalPoints,
      calculations,
      metadata: {
        calculatedAt: new Date().toISOString(),
        isHost,
        meetingDuration: 10, // 10분 고정
        minimumDuration: 10,
      },
    };

    return { finalPoints, details };
  }

  /**
   * 중복 참여자 확인 (같은 모임에 이전에 함께 참여한 사용자들)
   */
  private async checkDuplicateParticipants(
    userId: string,
    currentMeetingId: string,
  ): Promise<string[]> {
    try {
      // 현재 모임의 다른 참가자들 조회
      const currentParticipants = await this.participantRepository.find({
        where: {
          meetingId: currentMeetingId,
          status: ParticipantStatus.JOINED,
        },
        select: ['userId'],
      });

      const currentParticipantIds = currentParticipants
        .map(p => p.userId)
        .filter(id => id !== userId); // 자기 자신 제외

      if (currentParticipantIds.length === 0) {
        return [];
      }

      // 해당 사용자가 이전에 참여했던 모임들 조회
      const previousMeetings = await this.participantRepository.find({
        where: {
          userId,
          status: ParticipantStatus.JOINED,
        },
        select: ['meetingId'],
      });

      const previousMeetingIds = previousMeetings
        .map(p => p.meetingId)
        .filter(id => id !== currentMeetingId); // 현재 모임 제외

      if (previousMeetingIds.length === 0) {
        return [];
      }

      // 이전 모임들에서 현재 모임 참가자들과 중복되는 사용자들 찾기
      const duplicateParticipants = await this.participantRepository.find({
        where: {
          meetingId: In(previousMeetingIds),
          userId: In(currentParticipantIds),
          status: ParticipantStatus.JOINED,
        },
        select: ['userId'],
      });

      const duplicateUserIds = [...new Set(duplicateParticipants.map(p => p.userId))];
      
      this.logger.log(
        `User ${userId} has ${duplicateUserIds.length} duplicate participants: ${duplicateUserIds.join(', ')}`,
      );

      return duplicateUserIds;
    } catch (error) {
      this.logger.error(`Failed to check duplicate participants for user ${userId}:`, error);
      return [];
    }
  }
}
