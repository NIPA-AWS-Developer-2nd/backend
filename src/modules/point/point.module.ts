import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PointTransaction,
  User,
  UserProfile,
  Meeting,
  MeetingParticipant,
} from '../../entities';
import { PointService } from './point.service';
import { PointController } from './point.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PointTransaction,
      User,
      UserProfile,
      Meeting,
      MeetingParticipant,
    ]),
    UserModule,
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}