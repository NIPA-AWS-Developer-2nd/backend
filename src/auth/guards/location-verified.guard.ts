import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from '../../modules/user/user.service';

interface _AuthenticatedRequest {
  user: {
    id: string;
  };
}

@Injectable()
export class LocationVerifiedGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
  ) {}

  canActivate(_context: ExecutionContext): Promise<boolean> {
    // 임시로 모든 요청 통과
    return Promise.resolve(true);

    /* 원래 코드 - 임시 비활성화
    // Check if location verification is required for this endpoint
    const requireLocationVerification = this.reflector.get<boolean>(
      'requireLocationVerification',
      context.getHandler(),
    );

    if (!requireLocationVerification) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('인증이 필요합니다.');
    }

    // Check if user's location is verified and not expired
    const isLocationVerified =
      await this.userService.checkLocationVerificationStatus(user.id);

    if (!isLocationVerified) {
      throw new ForbiddenException(
        '지역 인증이 필요합니다. 설정에서 위치 인증을 완료해주세요.',
      );
    }

    return true;
    */
  }
}
