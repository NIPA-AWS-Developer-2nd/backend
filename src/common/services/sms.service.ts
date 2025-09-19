import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

export interface SmsRequest {
  to: string;
  text: string;
  from?: string;
}

export interface SmsResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

interface _CoolSmsApiResponse {
  messageId: string;
  statusCode: string;
  statusMessage: string;
}

interface _CoolSmsErrorResponse {
  message: string;
  errorCode: string;
}

@Injectable()
export class SmsService {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly fromNumber: string;
  private readonly baseUrl = 'https://api.solapi.com';

  constructor(
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.apiKey = this.configService.get<string>('COOLSMS_API_KEY');
    this.apiSecret = this.configService.get<string>('COOLSMS_API_SECRET');
    this.fromNumber = this.configService.get<string>(
      'COOLSMS_FROM_NUMBER',
      '02-000-0000',
    );
  }

  async sendSms(request: SmsRequest): Promise<SmsResponse> {
    try {
      // ISO 8601 형식의 날짜 생성
      const date = new Date().toISOString();
      const salt = this.generateSalt();
      const signature = this.generateSignature(date, salt);

      const payload = {
        message: {
          to: request.to,
          from: request.from || this.fromNumber,
          text: request.text,
        },
      };

      this.logger.info('Cool SMS API 요청', {
        url: `${this.baseUrl}/messages/v4/send`,
        apiKey: this.apiKey,
        date,
        salt,
        signature,
        payload: JSON.stringify(payload),
      });

      const response = await axios.post<_CoolSmsApiResponse>(
        `${this.baseUrl}/messages/v4/send`,
        payload,
        {
          headers: {
            Authorization: `HMAC-SHA256 apiKey=${this.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.info('SMS sent successfully', {
        to: request.to,
        messageId: response.data.messageId,
        action: 'send_sms',
      });

      return {
        success: true,
        message: 'SMS sent successfully',
        messageId: response.data.messageId,
      };
    } catch (error) {
      const axiosError = error as AxiosError<_CoolSmsErrorResponse>;

      this.logger.error('Failed to send SMS', {
        to: request.to,
        error: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        action: 'send_sms_failed',
      });

      return {
        success: false,
        message: `Failed to send SMS: ${axiosError.response?.data?.message || axiosError.message}`,
      };
    }
  }

  async sendVerificationCode(
    phoneNumber: string,
    code: string,
  ): Promise<SmsResponse> {
    const message = `[할사람] 인증번호: ${code}\n5분 내에 입력해주세요.`;

    return this.sendSms({
      to: phoneNumber,
      text: message,
    });
  }

  private generateSalt(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateSignature(date: string, salt: string): string {
    const data = date + salt;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(data)
      .digest('hex');
  }
}
