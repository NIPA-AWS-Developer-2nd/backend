import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { MeetingNotificationHelper } from './helpers/meeting-notification.helper';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { Notification } from '../../entities/notification.entity';
import { Meeting, Mission } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription, Notification, Meeting, Mission])],
  controllers: [NotificationController],
  providers: [NotificationService, PushNotificationService, MeetingNotificationHelper],
  exports: [NotificationService, PushNotificationService, MeetingNotificationHelper],
})
export class NotificationModule {}