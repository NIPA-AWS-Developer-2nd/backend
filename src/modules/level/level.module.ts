import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelController } from './level.controller';
import { LevelService } from './level.service';
import { Level } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService],
})
export class LevelModule {}
