import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../../../entities/notification.entity';

export class SubscribeToNotificationsDto {
  @ApiProperty({
    description: 'Push subscription object from browser',
    example: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/...',
      keys: {
        p256dh: 'BHQ...',
        auth: 'A1...',
      },
    },
  })
  @IsObject()
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Browser type',
    example: 'chrome',
  })
  @IsOptional()
  @IsString()
  browser?: string;
}

export class CreateNotificationDto {
  @ApiProperty({
    description: '알림 제목',
    example: '미팅 알림',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: '30분 후 미팅이 시작됩니다.',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: '알림 아이콘 URL',
    example: 'https://example.com/icon.png',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: '알림 이미지 URL',
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: '알림 배지 URL',
    example: 'https://example.com/badge.png',
  })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({
    description: '클릭 시 이동할 URL',
    example: 'https://app.example.com/meeting/123',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: '알림 타입',
    enum: NotificationType,
    example: NotificationType.MEETING_REMINDER,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: '추가 데이터',
    example: { meetingId: '123', userId: '456' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    description: '예약 발송 시간',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SendNotificationToUserDto extends CreateNotificationDto {
  @ApiProperty({
    description: '사용자 ID',
    example: '01HQXXX123',
  })
  @IsString()
  userId: string;
}

export class SendBulkNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: '사용자 ID 목록',
    example: ['01HQXXX123', '01HQXXX456'],
  })
  @IsString({ each: true })
  userIds: string[];
}

export class UnsubscribeDto {
  @ApiProperty({
    description: 'Push subscription endpoint',
    example: 'https://fcm.googleapis.com/fcm/send/...',
  })
  @IsString()
  endpoint: string;
}
