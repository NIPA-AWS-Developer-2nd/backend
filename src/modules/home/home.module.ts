import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Mission } from '../../entities/mission.entity';
import { Meeting } from '../../entities/meeting.entity';
import { UserMission } from '../../entities/user-mission.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Mission,
      Meeting,
      UserMission,
      MeetingParticipant,
      ActivityLog,
    ]),
    SchedulerModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
