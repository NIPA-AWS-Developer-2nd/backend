import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionVerificationController } from './mission-verification.controller';
import { MissionVerificationService } from './mission-verification.service';
import { MissionReview } from '../../entities/mission-review.entity';
import { Meeting } from '../../entities/meeting.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MissionReview, Meeting, MeetingParticipant]),
  ],
  controllers: [MissionVerificationController],
  providers: [MissionVerificationService],
  exports: [MissionVerificationService],
})
export class MissionVerificationModule {}