import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { UserModule } from '../user/user.module';
import { Meeting } from '../../entities/meeting.entity';
import { MeetingAttendance } from '../../entities/meeting-attendance.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { UserProfile } from '../../entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      MeetingAttendance,
      MeetingParticipant,
      UserProfile,
    ]),
    UserModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
