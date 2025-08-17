import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MissionVerificationController } from './mission-verification.controller';
import { MissionVerificationService } from './mission-verification.service';
import { BedrockService } from './bedrock.service';
import { MissionReview } from '../../entities/mission-review.entity';
import { Meeting } from '../../entities/meeting.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { Mission } from '../../entities/mission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MissionReview,
      Meeting,
      MeetingParticipant,
      Mission,
    ]),
    ConfigModule,
  ],
  controllers: [MissionVerificationController],
  providers: [MissionVerificationService, BedrockService],
  exports: [MissionVerificationService],
})
export class MissionVerificationModule {}
