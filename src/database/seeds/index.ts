import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../../config/database.config';
import { ConfigService } from '@nestjs/config';
import { seedInitialData } from './seed-data';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${String(timestamp)}] ${String(level)}: ${String(message)}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

// env 로드
const envPath = path.resolve(__dirname, '../../../.env.development');
dotenv.config({ path: envPath });

async function runSeeds() {
  const configService = new ConfigService();
  const dataSourceOptions = getDatabaseConfig(
    configService,
  ) as DataSourceOptions;

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    logger.info('📦 Connected to the database.');

    await seedInitialData(dataSource);

    logger.info('✅ All seeding operations have been completed.');
  } catch (error) {
    logger.error('❌ An error occurred during the seeding process:', error);
  } finally {
    await dataSource.destroy();
    logger.info('📦 Database connection has been closed.');
  }
}

void runSeeds();
