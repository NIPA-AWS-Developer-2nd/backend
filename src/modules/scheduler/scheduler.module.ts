import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingSchedulerService } from './meeting-scheduler.service';
import { Meeting, MeetingParticipant, MeetingAttendance } from '../../entities';
import { MissionReview } from '../../entities/mission-review.entity';
import { PointModule } from '../point/point.module';
import { NotificationModule } from '../notification/notification.module';
import { MissionVerificationModule } from '../mission/mission-verification.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Meeting,
      MeetingParticipant,
      MeetingAttendance,
      MissionReview,
    ]),
    PointModule,
    NotificationModule,
    MissionVerificationModule,
  ],
  providers: [MeetingSchedulerService],
  exports: [MeetingSchedulerService],
})
export class SchedulerModule {}
