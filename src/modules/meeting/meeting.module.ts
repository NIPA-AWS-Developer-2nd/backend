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
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Meeting,
      MeetingProfile,
      MeetingProfileTrait,
      MeetingParticipant,
    ]),
    UserModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, LocationVerifiedGuard],
  exports: [MeetingService],
})
export class MeetingModule {}
