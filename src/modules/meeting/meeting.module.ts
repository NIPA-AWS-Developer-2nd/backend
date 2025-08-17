import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import {
  Meeting,
  MeetingProfile,
  MeetingProfileTrait,
  MeetingParticipant,
  Mission,
  MeetingLike,
} from '../../entities';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';
import { UserModule } from '../user/user.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { PointModule } from '../point/point.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      MeetingProfile,
      MeetingProfileTrait,
      MeetingParticipant,
      Mission,
      MeetingLike,
    ]),
    UserModule,
    SchedulerModule,
    PointModule,
    NotificationModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, LocationVerifiedGuard],
  exports: [MeetingService],
})
export class MeetingModule {}
