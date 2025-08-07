import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {
  User,
  UserProfile,
  UserRewards,
  District,
  Category,
  Level,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserRewards,
      District,
      Category,
      Level,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
