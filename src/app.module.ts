import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { DistrictModule } from './modules/district/district.module';
import { LevelModule } from './modules/level/level.module';
import { UserInterestsModule } from './modules/user-interests/user-interests.module';
import { UserHashtagsModule } from './modules/user-hashtags/user-hashtags.module';
import { MissionModule } from './modules/mission/mission.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AwsModule } from './aws/aws.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
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
    CategoryModule,
    DistrictModule,
    LevelModule,
    UserInterestsModule,
    UserHashtagsModule,
    MissionModule,
    HealthModule,
    AuthModule,
    AwsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
