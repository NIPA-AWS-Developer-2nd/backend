import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { Notification, NotificationStatus } from '../../entities/notification.entity';
import { PushSubscriptionData, NotificationPayload } from './types';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly pushSubscriptionRepository: Repository<PushSubscription>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT?.startsWith('mailto:') 
      ? process.env.VAPID_SUBJECT 
      : `mailto:${process.env.VAPID_SUBJECT || 'your-email@example.com'}`;

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Web push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  }

  async saveSubscription(
    userId: string,
    subscriptionData: PushSubscriptionData,
    browser = 'chrome',
  ): Promise<PushSubscription> {
    // 기존 활성 구독들을 모두 비활성화 (사용자당 하나의 활성 구독만 유지)
    await this.pushSubscriptionRepository.update(
      { userId, isActive: true },
      { isActive: false }
    );

    // 동일한 endpoint가 있는지 확인
    const existingSubscription = await this.pushSubscriptionRepository.findOne({
      where: { userId, endpoint: subscriptionData.endpoint },
    });

    if (existingSubscription) {
      existingSubscription.p256dhKey = subscriptionData.keys.p256dh;
      existingSubscription.authKey = subscriptionData.keys.auth;
      existingSubscription.browser = browser;
      existingSubscription.isActive = true;
      return await this.pushSubscriptionRepository.save(existingSubscription);
    }

    // 새로운 구독 생성
    const newSubscription = this.pushSubscriptionRepository.create({
      userId,
      endpoint: subscriptionData.endpoint,
      p256dhKey: subscriptionData.keys.p256dh,
      authKey: subscriptionData.keys.auth,
      browser,
      isActive: true,
    });

    return await this.pushSubscriptionRepository.save(newSubscription);
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.update(
      { userId, endpoint },
      { isActive: false },
    );
  }

  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await this.pushSubscriptionRepository.find({
      where: { userId, isActive: true },
    });
  }

  async sendNotificationToUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<boolean> {
    const subscriptions = await this.getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      this.logger.warn(`No active subscriptions found for user ${userId}`);
      return false;
    }

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.sendPushNotification(subscription, payload),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === 'fulfilled',
    ).length;

    this.logger.log(
      `Sent notification to ${successCount}/${subscriptions.length} subscriptions for user ${userId}`,
    );

    return successCount > 0;
  }

  async sendNotificationToMultipleUsers(
    userIds: string[],
    payload: NotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.sendNotificationToUser(userId, payload)),
    );

    const success = results.filter(
      (result) => result.status === 'fulfilled' && result.value === true,
    ).length;

    const failed = results.length - success;

    this.logger.log(
      `Bulk notification sent: ${success} success, ${failed} failed`,
    );

    return { success, failed };
  }

  private async sendPushNotification(
    subscription: PushSubscription,
    payload: NotificationPayload,
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
      );
      
      this.logger.debug(`Notification sent successfully to ${subscription.endpoint}`);
    } catch (error) {
      this.logger.error(
        `Failed to send notification to ${subscription.endpoint}:`,
        error.message,
      );

      if (error.statusCode === 410) {
        await this.removeSubscription(subscription.userId, subscription.endpoint);
        this.logger.log(`Removed invalid subscription: ${subscription.endpoint}`);
      }

      throw error;
    }
  }

  async scheduleNotification(
    userId: string,
    payload: NotificationPayload,
    scheduledAt: Date,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      image: payload.image,
      badge: payload.badge,
      url: payload.url,
      data: payload.data,
      scheduledAt,
    });

    return await this.notificationRepository.save(notification);
  }

  async processScheduledNotifications(): Promise<void> {
    const now = new Date();
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        scheduledAt: LessThanOrEqual(now),
        status: NotificationStatus.PENDING,
      },
    });

    for (const notification of scheduledNotifications) {
      try {
        const payload: NotificationPayload = {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          image: notification.image,
          badge: notification.badge,
          url: notification.url,
          data: notification.data,
        };

        const success = await this.sendNotificationToUser(
          notification.userId,
          payload,
        );

        notification.status = success ? NotificationStatus.SENT : NotificationStatus.FAILED;
        notification.sentAt = new Date();
        await this.notificationRepository.save(notification);
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled notification ${notification.id}:`,
          error.message,
        );
        notification.status = NotificationStatus.FAILED;
        await this.notificationRepository.save(notification);
      }
    }
  }
}