import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Request } from 'express';
import { User, UserStatus } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string; // userId (ULID)
  phoneNumber?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required but not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          return request?.cookies?.access_token as string | null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn('JWT 검증 실패: 사용자를 찾을 수 없음', {
          userId,
          action: 'jwt_validation_failed',
        });
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      if (user.status !== UserStatus.ACTIVE) {
        this.logger.warn('JWT 검증 실패: 비활성 사용자', {
          userId,
          status: user.status,
          action: 'jwt_validation_inactive_user',
        });
        throw new UnauthorizedException('계정이 비활성화되었습니다.');
      }

      this.logger.debug('JWT 검증 성공', {
        userId,
        phoneNumber: user.phoneNumber,
        action: 'jwt_validation_success',
      });

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('JWT 검증 중 오류 발생', {
        userId,
        error: error instanceof Error ? error.message : String(error),
        action: 'jwt_validation_error',
      });

      throw new UnauthorizedException('토큰 검증에 실패했습니다.');
    }
  }
}
