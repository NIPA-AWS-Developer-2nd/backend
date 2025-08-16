import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { Mission } from '../../entities/mission.entity';
import { UserMission } from '../../entities/user-mission.entity';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mission, UserMission]), UserModule],
  controllers: [MissionController],
  providers: [MissionService, LocationVerifiedGuard],
  exports: [MissionService],
})
export class MissionModule {}
