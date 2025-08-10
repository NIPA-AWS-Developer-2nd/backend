import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInterests } from '../../entities';
import { UserInterestsController } from './user-interests.controller';
import { UserInterestsService } from './user-interests.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserInterests])],
  controllers: [UserInterestsController],
  providers: [UserInterestsService],
  exports: [UserInterestsService],
})
export class UserInterestsModule {}
