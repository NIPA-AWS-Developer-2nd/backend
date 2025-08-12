import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import {
  Meeting,
  MeetingProfile,
  MeetingProfileTrait,
  MeetingParticipant,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      MeetingProfile,
      MeetingProfileTrait,
      MeetingParticipant,
    ]),
  ],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
