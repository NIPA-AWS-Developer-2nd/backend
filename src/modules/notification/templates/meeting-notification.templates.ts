import { NotificationType } from '../../../entities/notification.entity';
import { NotificationPayload } from '../types';

export interface MeetingNotificationData {
  meetingId: string;
  meetingTitle: string;
  hostName: string;
  participantName?: string;
  participantCount?: number;
  maxParticipants?: number;
  timeRemaining?: string;
  meetingDate?: string;
  meetingTime?: string;
  pointAmount?: number;
  pointReason?: string;
  chatMessage?: string;
  senderName?: string;
}

export class MeetingNotificationTemplates {
  static participantJoined(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `${data.meetingTitle} 모임에 새로운 참가자가 합류했어요!`,
      body: `${data.participantName}님이 모임에 참여했습니다. (${data.participantCount}/${data.maxParticipants}명)`,
      icon: '/icons/meeting-join.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'meeting_participant_joined',
        meetingId: data.meetingId,
        participantCount: data.participantCount,
        maxParticipants: data.maxParticipants,
      },
    };
  }

  static meetingFull(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `🎉 ${data.meetingTitle} 모임이 가득 찼어요!`,
      body: `모든 인원이 모집되었습니다. 곧 만나요! (${data.maxParticipants}/${data.maxParticipants}명)`,
      icon: '/icons/meeting-full.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'meeting_full',
        meetingId: data.meetingId,
        participantCount: data.maxParticipants,
      },
    };
  }

  static recruitmentDeadlineWarning(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `⏰ ${data.meetingTitle} 모집 마감 임박!`,
      body: `${data.timeRemaining} 후 모집이 마감됩니다. 서둘러 참여해보세요!`,
      icon: '/icons/meeting-deadline.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'recruitment_deadline_warning',
        meetingId: data.meetingId,
        timeRemaining: data.timeRemaining,
      },
    };
  }

  static recruitmentClosed(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `${data.meetingTitle} 모집이 마감되었습니다`,
      body: `모집 시간이 종료되어 더 이상 참여할 수 없습니다.`,
      icon: '/icons/meeting-closed.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'recruitment_closed',
        meetingId: data.meetingId,
      },
    };
  }

  static activityStartReminder(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `🔔 ${data.meetingTitle} 활동 시작 예정!`,
      body: `${data.timeRemaining} 후 활동이 시작됩니다. 준비해주세요!`,
      icon: '/icons/meeting-reminder.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'activity_start_reminder',
        meetingId: data.meetingId,
        timeRemaining: data.timeRemaining,
      },
    };
  }

  static activityStarted(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `🚀 ${data.meetingTitle} 활동이 시작되었습니다!`,
      body: `출석 체크와 채팅, 미션 인증 기능이 활성화되었어요. 지금 참여해보세요!`,
      icon: '/icons/meeting-start.png',
      url: `/meeting/${data.meetingId}/channel`,
      data: {
        type: 'activity_started',
        meetingId: data.meetingId,
        hasAttendance: true,
        hasChat: true,
        hasMission: true,
      },
    };
  }

  static noShowWarning(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `⚠️ ${data.meetingTitle} 노쇼 처리`,
      body: `출석 체크 시간이 종료되어 노쇼로 처리되었습니다. 다음에는 꼭 참여해주세요.`,
      icon: '/icons/no-show.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'no_show_warning',
        meetingId: data.meetingId,
        penalty: true,
      },
    };
  }

  static pointEarned(data: MeetingNotificationData): NotificationPayload {
    const missionInfo = data.meetingTitle ? ` (${data.meetingTitle})` : '';
    return {
      title: `💰 포인트 획득!`,
      body: `${data.pointReason}${missionInfo}으로 ${data.pointAmount}P를 획득했습니다!`,
      icon: '/icons/point-earned.png',
      url: `/point/history`,
      data: {
        type: 'point_earned',
        amount: data.pointAmount,
        reason: data.pointReason,
        meetingId: data.meetingId,
        missionTitle: data.meetingTitle,
      },
    };
  }

  static pointDeducted(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `💸 포인트 차감`,
      body: `${data.pointReason}으로 ${data.pointAmount}P가 차감되었습니다.`,
      icon: '/icons/point-deducted.png',
      url: `/point/history`,
      data: {
        type: 'point_deducted',
        amount: data.pointAmount,
        reason: data.pointReason,
        meetingId: data.meetingId,
      },
    };
  }

  static newChatMessage(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `💬 ${data.meetingTitle}`,
      body: `${data.senderName}: ${data.chatMessage}`,
      icon: '/icons/chat-message.png',
      url: `/meeting/${data.meetingId}/channel`,
      data: {
        type: 'new_chat_message',
        meetingId: data.meetingId,
        senderId: data.senderName,
      },
    };
  }

  static meetingLiked(data: MeetingNotificationData): NotificationPayload {
    return {
      title: `❤️ ${data.meetingTitle} 모임을 좋아해요!`,
      body: `${data.participantName}님이 회원님의 모임에 좋아요를 눌렀습니다.`,
      icon: '/icons/heart.png',
      url: `/meeting/${data.meetingId}`,
      data: {
        type: 'meeting_liked',
        meetingId: data.meetingId,
        likerId: data.participantName,
      },
    };
  }
}

export const getMeetingNotificationType = (templateType: string): NotificationType => {
  const typeMap: Record<string, NotificationType> = {
    'meeting_participant_joined': NotificationType.MEETING_REMINDER,
    'meeting_full': NotificationType.MEETING_REMINDER,
    'recruitment_deadline_warning': NotificationType.MEETING_REMINDER,
    'recruitment_closed': NotificationType.MEETING_REMINDER,
    'activity_start_reminder': NotificationType.MEETING_REMINDER,
    'activity_started': NotificationType.MEETING_REMINDER,
    'no_show_warning': NotificationType.SYSTEM_NOTICE,
    'point_earned': NotificationType.SYSTEM_NOTICE,
    'point_deducted': NotificationType.SYSTEM_NOTICE,
    'new_chat_message': NotificationType.MEETING_REMINDER,
    'meeting_liked': NotificationType.FRIEND_REQUEST,
  };

  return typeMap[templateType] || NotificationType.SYSTEM_NOTICE;
};