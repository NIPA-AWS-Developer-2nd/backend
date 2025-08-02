import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          level: isProduction ? 'warn' : 'debug',
          levels: isProduction
            ? { error: 0, warn: 1, log: 2 }
            : winston.config.npm.levels,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          transports: [
            new winston.transports.Console({
              level: isProduction ? 'warn' : 'debug',
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(
                  ({
                    timestamp,
                    level,
                    message,
                    ...meta
                  }: winston.Logform.TransformableInfo) => {
                    const metaStr = Object.keys(meta).length
                      ? `\n${JSON.stringify(meta, null, 2)}`
                      : '';
                    return `[${String(timestamp)}] ${String(level)}: ${String(message)}${metaStr}`;
                  },
                ),
              ),
            }),
            ...(isProduction
              ? [
                  new winston.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                  }),
                  new winston.transports.File({
                    filename: 'logs/combined.log',
                    level: 'warn',
                  }),
                ]
              : []),
          ],
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    HealthModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
