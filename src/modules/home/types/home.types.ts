import { Mission } from '../../../entities/mission.entity';
import { ActivityLog } from '../../../entities/activity-log.entity';

export interface HomeData {
  availableMissions: Mission[];
  hotMeetings: HotMeeting[]; // HOT한 번개 모임
  myMeetings: MyMeeting[]; // 내 참여/완료 모임
  activityLogs: ActivityLog[]; // 내 최근 활동 로그
  currentUser: {
    id: string;
  };
}

// HOT한 번개 모임 (좋아요 수 + 참가 인원 수 기준)
export interface HotMeeting {
  id: string;
  title: string;
  scheduledAt: Date;
  location?: string;
  maxParticipants: number;
  currentParticipants: number;
  likesCount: number;
  hostName: string;
  host?: {
    id: string;
    nickname: string;
    profileImageUrl: string;
    level?: number;
    mbti?: string | null;
    bio?: string | null;
  };
  region?: {
    id: string;
    districtName: string;
    city: string;
  };
  participants?: {
    profileImageUrl: string;
  }[];
  mission?: {
    title: string;
    difficulty: string;
    basePoints: number;
    thumbnailUrl?: string;
  };
}

// 내 참여/완료 모임
export interface MyMeeting {
  id: string;
  title: string;
  status: 'recruiting' | 'ready' | 'active' | 'completed' | 'canceled';
  scheduledAt: Date;
  recruitUntil: Date | null;
  isHost: boolean;
  meJoined: boolean;
  participantCount: number;
  currentParticipants: number;
  maxParticipants: number;
  participants: Array<{
    userId: string;
    nickname?: string;
    profileImageUrl?: string | null;
    isHost: boolean;
  }>;
  mission?: {
    title: string;
    basePoints: number;
    thumbnailUrl?: string;
    difficulty?: string;
    location?: string;
  };
}

export interface GetHomeDataQuery {
  limit?: number;
}
