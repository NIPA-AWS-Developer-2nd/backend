import { DataSource } from 'typeorm';
import * as winston from 'winston';
import { Level } from '../../../entities';

const levels = [
  { requiredPoints: 0, name: '1', rewardAiTickets: 0 },
  { requiredPoints: 200, name: '2', rewardAiTickets: 1 },
  { requiredPoints: 450, name: '3', rewardAiTickets: 1 },
  { requiredPoints: 750, name: '4', rewardAiTickets: 1 },
  { requiredPoints: 1100, name: '5', rewardAiTickets: 1 },
  { requiredPoints: 1500, name: '6', rewardAiTickets: 1 },
  { requiredPoints: 1950, name: '7', rewardAiTickets: 1 },
  { requiredPoints: 2450, name: '8', rewardAiTickets: 1 },
  { requiredPoints: 3000, name: '9', rewardAiTickets: 1 },
  { requiredPoints: 3600, name: '10', rewardAiTickets: 1 },
  { requiredPoints: 4300, name: '11', rewardAiTickets: 1 },
  { requiredPoints: 5100, name: '12', rewardAiTickets: 1 },
  { requiredPoints: 6000, name: '13', rewardAiTickets: 2 },
  { requiredPoints: 7000, name: '14', rewardAiTickets: 2 },
  { requiredPoints: 8150, name: '15', rewardAiTickets: 2 },
  { requiredPoints: 9450, name: '16', rewardAiTickets: 2 },
  { requiredPoints: 10900, name: '17', rewardAiTickets: 2 },
  { requiredPoints: 12500, name: '18', rewardAiTickets: 2 },
  { requiredPoints: 14250, name: '19', rewardAiTickets: 2 },
  { requiredPoints: 16150, name: '20', rewardAiTickets: 3 },
  { requiredPoints: 18200, name: '21', rewardAiTickets: 3 },
  { requiredPoints: 20400, name: '22', rewardAiTickets: 3 },
  { requiredPoints: 22750, name: '23', rewardAiTickets: 4 },
  { requiredPoints: 25250, name: '24', rewardAiTickets: 4 },
  { requiredPoints: 27900, name: '25', rewardAiTickets: 4 },
  { requiredPoints: 30700, name: '26', rewardAiTickets: 5 },
  { requiredPoints: 33650, name: '27', rewardAiTickets: 5 },
  { requiredPoints: 36750, name: '28', rewardAiTickets: 6 },
  { requiredPoints: 40000, name: '29', rewardAiTickets: 6 },
  { requiredPoints: 43400, name: '30', rewardAiTickets: 7 },
];

export const seedLevels = async (
  dataSource: DataSource,
  logger: winston.Logger,
) => {
  const levelRepository = dataSource.getRepository(Level);

  for (const levelData of levels) {
    const existingLevel = await levelRepository.findOne({
      where: { requiredPoints: levelData.requiredPoints },
    });

    if (!existingLevel) {
      const level = levelRepository.create(levelData);
      await levelRepository.save(level);
      logger.info(
        `레벨 생성: ${levelData.name} (${levelData.requiredPoints} 포인트)`,
      );
    }
  }
};
