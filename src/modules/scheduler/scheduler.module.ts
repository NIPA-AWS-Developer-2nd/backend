import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingSchedulerService } from './meeting-scheduler.service';
import { Meeting, MeetingParticipant } from '../../entities';
import { PointModule } from '../point/point.module';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Meeting, MeetingParticipant]),
    PointModule,
  ],
  providers: [MeetingSchedulerService],
  exports: [MeetingSchedulerService]
})
export class SchedulerModule {}