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
  ],
  controllers: [MeetingController],
  providers: [MeetingService, LocationVerifiedGuard],
  exports: [MeetingService],
})
export class MeetingModule {}
