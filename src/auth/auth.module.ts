import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { KakaoService } from './service/kakao.service';
import { NaverService } from './service/naver.service';
import { GoogleService } from './service/google.service';
import { PhoneService } from './service/phone.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  User,
  SocialAccount,
  AuthToken,
  UserProfile,
  UserRewards,
} from '../entities';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      SocialAccount,
      AuthToken,
      UserProfile,
      UserRewards,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error('JWT_SECRET is required but not configured');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn:
              configService.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN') || '1h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoService,
    NaverService,
    GoogleService,
    PhoneService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
