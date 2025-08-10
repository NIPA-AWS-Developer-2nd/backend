import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHashtags } from '../../entities';
import { UserHashtagsController } from './user-hashtags.controller';
import { UserHashtagsService } from './user-hashtags.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserHashtags])],
  controllers: [UserHashtagsController],
  providers: [UserHashtagsService],
  exports: [UserHashtagsService],
})
export class UserHashtagsModule {}
