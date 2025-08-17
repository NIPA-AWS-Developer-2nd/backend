import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting, Mission } from '../../../entities';
import { NotificationService } from '../notification.service';
import {
  MeetingNotificationTemplates,
  MeetingNotificationData,
  getMeetingNotificationType,
} from '../templates/meeting-notification.templates';

@Injectable()
export class MeetingNotificationHelper {
  private readonly logger = new Logger(MeetingNotificationHelper.name);

  constructor(
    private readonly notificationService: NotificationService,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
  ) {}

  // 미션 제목을 가져오는 헬퍼 메서드
  private async getMeetingTitle(meetingId: string): Promise<string> {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
      relations: ['mission'],
    });

    if (!meeting?.mission) {
      // Fallback: 직접 조인 쿼리
      const result = await this.meetingRepository
        .createQueryBuilder('meeting')
        .leftJoin('mission', 'mission', 'meeting.missionId = mission.id')
        .select('mission.title', 'title')
        .where('meeting.id = :meetingId', { meetingId })
        .getRawOne();

      return result?.title || '알 수 없는 모임';
    }

    return meeting.mission.title;
  }

  async notifyParticipantJoined(
    hostId: string,
    participantName: string,
    meetingData: {
      id: string;
      currentParticipants: number;
      maxParticipants: number;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        participantName,
        participantCount: meetingData.currentParticipants,
        maxParticipants: meetingData.maxParticipants,
      };

      const payload =
        MeetingNotificationTemplates.participantJoined(templateData);
      const notificationType = getMeetingNotificationType(
        'meeting_participant_joined',
      );

      await this.notificationService.sendImmediateNotification({
        userId: hostId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        url: payload.url,
        type: notificationType,
        data: payload.data,
      });

      this.logger.log(
        `Participant joined notification sent to host ${hostId} for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send participant joined notification:`,
        error,
      );
    }
  }

  async notifyMeetingFull(
    participantIds: string[],
    meetingData: {
      id: string;
      maxParticipants: number;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        maxParticipants: meetingData.maxParticipants,
      };

      const payload = MeetingNotificationTemplates.meetingFull(templateData);
      const notificationType = getMeetingNotificationType('meeting_full');

      await this.notificationService.sendBulkNotification(
        participantIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Meeting full notification sent to ${participantIds.length} participants for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send meeting full notification:`, error);
    }
  }

  async notifyRecruitmentDeadlineWarning(
    userIds: string[],
    meetingData: {
      id: string;
    },
    timeRemaining: string,
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        timeRemaining,
      };

      const payload =
        MeetingNotificationTemplates.recruitmentDeadlineWarning(templateData);
      const notificationType = getMeetingNotificationType(
        'recruitment_deadline_warning',
      );

      await this.notificationService.sendBulkNotification(
        userIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Recruitment deadline warning sent to ${userIds.length} users for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send recruitment deadline warning:`, error);
    }
  }

  async notifyRecruitmentClosed(
    userIds: string[],
    meetingData: {
      id: string;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
      };

      const payload =
        MeetingNotificationTemplates.recruitmentClosed(templateData);
      const notificationType = getMeetingNotificationType('recruitment_closed');

      await this.notificationService.sendBulkNotification(
        userIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Recruitment closed notification sent to ${userIds.length} users for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send recruitment closed notification:`,
        error,
      );
    }
  }

  async notifyActivityStartReminder(
    participantIds: string[],
    meetingData: {
      id: string;
    },
    timeRemaining: string,
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        timeRemaining,
      };

      const payload =
        MeetingNotificationTemplates.activityStartReminder(templateData);
      const notificationType = getMeetingNotificationType(
        'activity_start_reminder',
      );

      await this.notificationService.sendBulkNotification(
        participantIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Activity start reminder sent to ${participantIds.length} participants for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send activity start reminder:`, error);
    }
  }

  async notifyActivityStarted(
    participantIds: string[],
    meetingData: {
      id: string;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
      };

      const payload =
        MeetingNotificationTemplates.activityStarted(templateData);
      const notificationType = getMeetingNotificationType('activity_started');

      await this.notificationService.sendBulkNotification(
        participantIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Activity started notification sent to ${participantIds.length} participants for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send activity started notification:`, error);
    }
  }

  async notifyNoShow(
    userId: string,
    meetingData: {
      id: string;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
      };

      const payload = MeetingNotificationTemplates.noShowWarning(templateData);
      const notificationType = getMeetingNotificationType('no_show_warning');

      await this.notificationService.sendImmediateNotification({
        userId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        url: payload.url,
        type: notificationType,
        data: payload.data,
      });

      this.logger.log(
        `No-show notification sent to user ${userId} for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send no-show notification:`, error);
    }
  }

  async notifyPointEarned(
    userId: string,
    pointAmount: number,
    reason: string,
    meetingId?: string,
  ): Promise<void> {
    try {
      let missionTitle = '';
      if (meetingId) {
        missionTitle = await this.getMeetingTitle(meetingId);
      }

      const templateData: MeetingNotificationData = {
        meetingId: meetingId || '',
        meetingTitle: missionTitle,
        hostName: '',
        pointAmount,
        pointReason: reason,
      };

      const payload = MeetingNotificationTemplates.pointEarned(templateData);
      const notificationType = getMeetingNotificationType('point_earned');

      await this.notificationService.sendImmediateNotification({
        userId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        url: payload.url,
        type: notificationType,
        data: payload.data,
      });

      this.logger.log(
        `Point earned notification sent to user ${userId}: ${pointAmount}P for ${reason} (mission: ${missionTitle})`,
      );
    } catch (error) {
      this.logger.error(`Failed to send point earned notification:`, error);
    }
  }

  async notifyPointDeducted(
    userId: string,
    pointAmount: number,
    reason: string,
    meetingId?: string,
  ): Promise<void> {
    try {
      const templateData: MeetingNotificationData = {
        meetingId: meetingId || '',
        meetingTitle: '',
        hostName: '',
        pointAmount,
        pointReason: reason,
      };

      const payload = MeetingNotificationTemplates.pointDeducted(templateData);
      const notificationType = getMeetingNotificationType('point_deducted');

      await this.notificationService.sendImmediateNotification({
        userId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        url: payload.url,
        type: notificationType,
        data: payload.data,
      });

      this.logger.log(
        `Point deducted notification sent to user ${userId}: ${pointAmount}P for ${reason}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send point deducted notification:`, error);
    }
  }

  async notifyNewChatMessage(
    recipientIds: string[],
    meetingData: {
      id: string;
    },
    senderName: string,
    message: string,
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);
      const truncatedMessage =
        message.length > 50 ? message.substring(0, 50) + '...' : message;

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        senderName,
        chatMessage: truncatedMessage,
      };

      const payload = MeetingNotificationTemplates.newChatMessage(templateData);
      const notificationType = getMeetingNotificationType('new_chat_message');

      await this.notificationService.sendBulkNotification(
        recipientIds,
        payload,
        notificationType,
      );

      this.logger.log(
        `Chat message notification sent to ${recipientIds.length} users for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send chat message notification:`, error);
    }
  }

  async notifyMeetingLiked(
    hostId: string,
    likerName: string,
    meetingData: {
      id: string;
    },
  ): Promise<void> {
    try {
      const meetingTitle = await this.getMeetingTitle(meetingData.id);

      const templateData: MeetingNotificationData = {
        meetingId: meetingData.id,
        meetingTitle,
        hostName: '',
        participantName: likerName,
      };

      const payload = MeetingNotificationTemplates.meetingLiked(templateData);
      const notificationType = getMeetingNotificationType('meeting_liked');

      await this.notificationService.sendImmediateNotification({
        userId: hostId,
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        url: payload.url,
        type: notificationType,
        data: payload.data,
      });

      this.logger.log(
        `Meeting liked notification sent to host ${hostId} for meeting ${meetingData.id}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send meeting liked notification:`, error);
    }
  }
}
