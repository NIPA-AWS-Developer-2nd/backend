import { NotificationType, NotificationStatus } from '../../../entities/notification.entity';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  url?: string;
  type?: NotificationType;
  data?: Record<string, any>;
  scheduledAt?: Date;
}

export interface SubscribeToNotificationsRequest {
  subscription: PushSubscriptionData;
  browser?: string;
}

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  status: NotificationStatus;
  createdAt: Date;
  sentAt?: Date | null;
}