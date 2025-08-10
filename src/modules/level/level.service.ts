import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '../../entities';

@Injectable()
export class LevelService {
  constructor(
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
  ) {}

  async getLevelInfo(level: number): Promise<{
    level: number;
    requiredPoints: number;
    name: string | null;
    rewardAiTickets: number;
  }> {
    const levelInfo = await this.levelRepository.findOne({
      where: { id: level },
    });

    if (!levelInfo) {
      throw new NotFoundException(
        `레벨 ${level}에 대한 정보를 찾을 수 없습니다.`,
      );
    }

    return {
      level: levelInfo.id,
      requiredPoints: levelInfo.requiredPoints,
      name: levelInfo.name,
      rewardAiTickets: levelInfo.rewardAiTickets,
    };
  }

  async getAllLevels(): Promise<Level[]> {
    return this.levelRepository.find({
      order: { id: 'ASC' },
    });
  }
}
