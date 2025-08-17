import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../../entities/notification.entity';
import { PushNotificationService } from './push-notification.service';
import {
  CreateNotificationRequest,
  NotificationResponse,
  NotificationPayload,
} from './types';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async createNotification(
    request: CreateNotificationRequest,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: request.userId,
      title: request.title,
      body: request.body,
      icon: request.icon,
      image: request.image,
      badge: request.badge,
      url: request.url,
      type: request.type || NotificationType.SYSTEM_NOTICE,
      data: request.data,
      scheduledAt: request.scheduledAt,
    });

    return await this.notificationRepository.save(notification);
  }

  async sendImmediateNotification(
    request: CreateNotificationRequest,
  ): Promise<{ notification: Notification; sent: boolean }> {
    const notification = await this.createNotification(request);

    const payload: NotificationPayload = {
      title: request.title,
      body: request.body,
      icon: request.icon,
      image: request.image,
      badge: request.badge,
      url: request.url,
      data: request.data,
    };

    try {
      const sent = await this.pushNotificationService.sendNotificationToUser(
        request.userId,
        payload,
      );

      notification.status = sent
        ? NotificationStatus.SENT
        : NotificationStatus.FAILED;
      notification.sentAt = sent ? new Date() : null;
      await this.notificationRepository.save(notification);

      return { notification, sent };
    } catch (error) {
      this.logger.error(
        `Failed to send immediate notification ${notification.id}:`,
        error.message,
      );

      notification.status = NotificationStatus.FAILED;
      await this.notificationRepository.save(notification);

      return { notification, sent: false };
    }
  }

  async sendBulkNotification(
    userIds: string[],
    payload: NotificationPayload,
    type: NotificationType = NotificationType.SYSTEM_NOTICE,
  ): Promise<{
    notifications: Notification[];
    results: { success: number; failed: number };
  }> {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.createNotification({
          userId,
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          image: payload.image,
          badge: payload.badge,
          url: payload.url,
          type,
          data: payload.data,
        }),
      ),
    );

    const results =
      await this.pushNotificationService.sendNotificationToMultipleUsers(
        userIds,
        payload,
      );

    await Promise.all(
      notifications.map(async (notification, index) => {
        notification.status =
          index < results.success
            ? NotificationStatus.SENT
            : NotificationStatus.FAILED;
        notification.sentAt = index < results.success ? new Date() : null;
        return this.notificationRepository.save(notification);
      }),
    );

    return { notifications, results };
  }

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: NotificationResponse[]; total: number }> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

    const notificationResponses: NotificationResponse[] = notifications.map(
      (notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        status: notification.status,
        createdAt: notification.createdAt,
        sentAt: notification.sentAt,
      }),
    );

    return { notifications: notificationResponses, total };
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (notification) {
      notification.data = { ...notification.data, read: true };
      await this.notificationRepository.save(notification);
    }
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    sent: number;
    failed: number;
  }> {
    const [total, unread, sent, failed] = await Promise.all([
      this.notificationRepository.count({ where: { userId } }),
      this.notificationRepository.count({
        where: { userId, data: { read: false } },
      }),
      this.notificationRepository.count({
        where: { userId, status: NotificationStatus.SENT },
      }),
      this.notificationRepository.count({
        where: { userId, status: NotificationStatus.FAILED },
      }),
    ]);

    return { total, unread, sent, failed };
  }
}
