import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl:
      configService.get<string>('NODE_ENV') === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : false,
    extra: {
      connectionLimit: 10,
    },
  };

  logger.info('===== Loaded Database Config =====');
  logger.info(`Host: ${dbConfig.host}`);
  logger.info(`Port: ${dbConfig.port}`);
  logger.info(`Username: ${dbConfig.username}`);
  logger.info(`Database: ${dbConfig.database}`);
  logger.info(`Synchronize: ${dbConfig.synchronize}`);
  logger.info('===================================');

  return dbConfig;
};
