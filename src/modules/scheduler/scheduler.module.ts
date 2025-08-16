import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingSchedulerService } from './meeting-scheduler.service';
import { Meeting, MeetingParticipant, MeetingAttendance } from '../../entities';
import { PointModule } from '../point/point.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Meeting, MeetingParticipant, MeetingAttendance]),
    PointModule,
  ],
  providers: [MeetingSchedulerService],
  exports: [MeetingSchedulerService],
})
export class SchedulerModule {}
