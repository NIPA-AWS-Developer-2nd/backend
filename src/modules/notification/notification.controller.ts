import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { Public } from '../../auth/decorators/public.decorator';
import {
  SubscribeToNotificationsDto,
  CreateNotificationDto,
  SendNotificationToUserDto,
  SendBulkNotificationDto,
  UnsubscribeDto,
} from './dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post('subscribe')
  @ApiOperation({
    summary: '푸시 알림 구독',
    description: '사용자의 푸시 알림 구독을 등록합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '구독 등록 성공',
    example: {
      status: 201,
      message: '푸시 알림 구독이 등록되었습니다.',
      result: true,
      data: {
        id: '01HQXXX123',
        userId: '01HQYYY456',
        endpoint: 'https://fcm.googleapis.com/fcm/send/...',
        browser: 'chrome',
        isActive: true,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '잘못된 요청',
    example: {
      status: 400,
      message: '유효하지 않은 구독 정보입니다.',
      result: false,
    },
  })
  async subscribeToNotifications(
    @Body() subscribeDto: SubscribeToNotificationsDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;

    if (!userId) {
      return {
        status: HttpStatus.UNAUTHORIZED,
        message: '로그인이 필요합니다.',
        result: false,
      };
    }

    const subscription = await this.pushNotificationService.saveSubscription(
      userId,
      subscribeDto.subscription,
      subscribeDto.browser,
    );

    return {
      status: HttpStatus.CREATED,
      message: '푸시 알림 구독이 등록되었습니다.',
      result: true,
      data: subscription,
    };
  }

  @Delete('unsubscribe')
  @ApiOperation({
    summary: '푸시 알림 구독 해제',
    description: '사용자의 푸시 알림 구독을 해제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '구독 해제 성공',
    example: {
      status: 200,
      message: '푸시 알림 구독이 해제되었습니다.',
      result: true,
    },
  })
  async unsubscribeFromNotifications(
    @Body() unsubscribeDto: UnsubscribeDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;

    await this.pushNotificationService.removeSubscription(
      userId,
      unsubscribeDto.endpoint,
    );

    return {
      status: HttpStatus.OK,
      message: '푸시 알림 구독이 해제되었습니다.',
      result: true,
    };
  }

  @Post('send')
  @ApiOperation({
    summary: '개별 사용자에게 알림 발송',
    description: '특정 사용자에게 즉시 알림을 발송합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '알림 발송 성공',
    example: {
      status: 201,
      message: '알림이 발송되었습니다.',
      result: true,
      data: {
        notification: {
          id: '01HQXXX123',
          title: '미팅 알림',
          body: '30분 후 미팅이 시작됩니다.',
          status: 'sent',
        },
        sent: true,
      },
    },
  })
  async sendNotificationToUser(@Body() sendDto: SendNotificationToUserDto) {
    const result = await this.notificationService.sendImmediateNotification({
      userId: sendDto.userId,
      title: sendDto.title,
      body: sendDto.body,
      icon: sendDto.icon,
      image: sendDto.image,
      badge: sendDto.badge,
      url: sendDto.url,
      type: sendDto.type,
      data: sendDto.data,
      scheduledAt: sendDto.scheduledAt
        ? new Date(sendDto.scheduledAt)
        : undefined,
    });

    return {
      status: HttpStatus.CREATED,
      message: result.sent
        ? '알림이 발송되었습니다.'
        : '알림 발송에 실패했습니다.',
      result: result.sent,
      data: result,
    };
  }

  @Post('send/bulk')
  @ApiOperation({
    summary: '다중 사용자에게 알림 발송',
    description: '여러 사용자에게 동시에 알림을 발송합니다.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '대량 알림 발송 성공',
    example: {
      status: 201,
      message: '3명 중 2명에게 알림이 발송되었습니다.',
      result: true,
      data: {
        results: { success: 2, failed: 1 },
        notifications: [],
      },
    },
  })
  async sendBulkNotification(@Body() bulkDto: SendBulkNotificationDto) {
    const payload = {
      title: bulkDto.title,
      body: bulkDto.body,
      icon: bulkDto.icon,
      image: bulkDto.image,
      badge: bulkDto.badge,
      url: bulkDto.url,
      data: bulkDto.data,
    };

    const result = await this.notificationService.sendBulkNotification(
      bulkDto.userIds,
      payload,
      bulkDto.type,
    );

    const total = bulkDto.userIds.length;
    const { success, failed } = result.results;

    return {
      status: HttpStatus.CREATED,
      message: `${total}명 중 ${success}명에게 알림이 발송되었습니다.`,
      result: success > 0,
      data: result,
    };
  }

  @Get('my')
  @ApiOperation({
    summary: '내 알림 목록 조회',
    description: '로그인한 사용자의 알림 목록을 조회합니다.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지 크기',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 목록 조회 성공',
    example: {
      status: 200,
      message: '알림 목록을 조회했습니다.',
      result: true,
      data: {
        notifications: [],
        total: 0,
        page: 1,
        limit: 20,
      },
    },
  })
  async getMyNotifications(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const result = await this.notificationService.getUserNotifications(
      userId,
      pageNum,
      limitNum,
    );

    return {
      status: HttpStatus.OK,
      message: '알림 목록을 조회했습니다.',
      result: true,
      data: {
        ...result,
        page: pageNum,
        limit: limitNum,
      },
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: '내 알림 통계',
    description: '로그인한 사용자의 알림 통계를 조회합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 통계 조회 성공',
    example: {
      status: 200,
      message: '알림 통계를 조회했습니다.',
      result: true,
      data: {
        total: 10,
        unread: 3,
        sent: 8,
        failed: 2,
      },
    },
  })
  async getNotificationStats(@Req() req: Request) {
    const userId = (req.user as any)?.id;
    const stats = await this.notificationService.getNotificationStats(userId);

    return {
      status: HttpStatus.OK,
      message: '알림 통계를 조회했습니다.',
      result: true,
      data: stats,
    };
  }

  @Post(':id/read')
  @ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음으로 표시합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 읽음 처리 성공',
    example: {
      status: 200,
      message: '알림을 읽음으로 처리했습니다.',
      result: true,
    },
  })
  async markNotificationAsRead(@Param('id') notificationId: string) {
    await this.notificationService.markNotificationAsRead(notificationId);

    return {
      status: HttpStatus.OK,
      message: '알림을 읽음으로 처리했습니다.',
      result: true,
    };
  }

  @Public()
  @Post('subscribe/:userId')
  @ApiOperation({
    summary: '푸시 구독 등록 (인증 없음)',
    description: '지정된 사용자의 푸시 구독을 등록합니다. (테스트용)',
  })
  async subscribeWithoutAuth(
    @Param('userId') userId: string,
    @Body() subscribeDto: SubscribeToNotificationsDto,
  ) {
    const subscription = await this.pushNotificationService.saveSubscription(
      userId,
      subscribeDto.subscription,
      subscribeDto.browser || 'chrome',
    );

    return {
      status: HttpStatus.CREATED,
      message: '푸시 알림 구독이 등록되었습니다.',
      result: true,
      data: subscription,
    };
  }

  @Public()
  @Post('create-test-subscription/:userId')
  @ApiOperation({
    summary: '테스트용 구독 생성',
    description: '테스트용 더미 구독을 생성합니다.',
  })
  async createTestSubscription(@Param('userId') userId: string) {
    try {
      // 더미 구독 정보 직접 생성
      const testSubscription =
        await this.pushNotificationService.saveSubscription(
          userId,
          {
            endpoint: 'https://fcm.googleapis.com/fcm/send/test',
            keys: {
              p256dh: 'test-p256dh-key',
              auth: 'test-auth-key',
            },
          },
          'chrome',
        );

      return {
        status: HttpStatus.CREATED,
        message: '테스트 구독이 생성되었습니다.',
        result: true,
        data: testSubscription,
      };
    } catch (error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '테스트 구독 생성 실패: ' + error.message,
        result: false,
      };
    }
  }

  @Public()
  @Post('test/:userId')
  @ApiOperation({
    summary: '테스트 알림 발송 (인증 없음)',
    description: '지정된 사용자에게 테스트 알림을 즉시 발송합니다. (테스트용)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '테스트 알림 발송 성공',
    example: {
      status: 201,
      message: '테스트 알림이 발송되었습니다.',
      result: true,
      data: {
        sent: true,
        message: '테스트 성공!',
      },
    },
  })
  async sendTestNotification(@Param('userId') userId: string) {
    if (!userId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: '사용자 ID가 필요합니다.',
        result: false,
      };
    }

    const result = await this.notificationService.sendImmediateNotification({
      userId,
      title: '🔔 테스트 알림',
      body: '푸시 알림이 정상적으로 작동하고 있습니다!',
      icon: '/icons/notification-icon.png',
      url: '/home',
      type: NotificationType.SYSTEM_NOTICE,
      data: {
        testTimestamp: new Date().toISOString(),
        source: 'test-api',
      },
    });

    return {
      status: HttpStatus.CREATED,
      message: result.sent
        ? '테스트 알림이 발송되었습니다.'
        : '알림 발송에 실패했습니다. 푸시 구독을 확인해주세요.',
      result: result.sent,
      data: {
        sent: result.sent,
        message: result.sent ? '테스트 성공!' : '구독 정보 없음 또는 발송 실패',
      },
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '알림 삭제 성공',
    example: {
      status: 200,
      message: '알림이 삭제되었습니다.',
      result: true,
    },
  })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any)?.id;
    await this.notificationService.deleteNotification(notificationId, userId);

    return {
      status: HttpStatus.OK,
      message: '알림이 삭제되었습니다.',
      result: true,
    };
  }
}
