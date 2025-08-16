import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LocationVerifiedGuard } from '../../auth/guards/location-verified.guard';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('meetings/:meetingId/generate-qr')
  @UseGuards(LocationVerifiedGuard)
  @ApiOperation({ summary: 'QR 코드 생성 (호스트 전용)' })
  @ApiResponse({
    status: 201,
    description: 'QR 코드 생성 성공',
    example: {
      status: 201,
      message: 'QR 코드가 생성되었습니다.',
      result: true,
      data: {
        qrCodeToken: 'abc123def456',
        expiresAt: '2025-08-15T06:00:00.000Z',
      },
    },
  })
  async generateQRCode(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.attendanceService.generateQRCode(
        meetingId,
        req.user.id,
      );
      return {
        status: 201,
        message: 'QR 코드가 생성되었습니다.',
        result: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: error.message,
          result: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('meetings/:meetingId/check-in')
  @UseGuards(LocationVerifiedGuard)
  @ApiOperation({ summary: 'QR 코드로 출석체크' })
  @ApiResponse({
    status: 201,
    description: '출석체크 성공',
    example: {
      status: 201,
      message: '출석체크가 완료되었습니다.',
      result: true,
      data: {
        attendanceId: '01K2P1ZMAJYSY27PMEDBM4X7DS',
        checkedInAt: '2025-08-15T05:30:00.000Z',
      },
    },
  })
  async checkIn(
    @Param('meetingId') meetingId: string,
    @Body() body: { qrCodeToken: string },
    @Request() req: any,
  ) {
    try {
      const result = await this.attendanceService.checkIn(
        meetingId,
        req.user.id,
        body.qrCodeToken,
      );
      return {
        status: 201,
        message: '출석체크가 완료되었습니다.',
        result: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: error.message,
          result: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('meetings/:meetingId/status')
  @ApiOperation({ summary: '모임 출석 현황 조회' })
  @ApiResponse({
    status: 200,
    description: '출석 현황 조회 성공',
    example: {
      status: 200,
      message: '출석 현황 조회 성공',
      result: true,
      data: {
        attendances: [
          {
            userId: '01K2P1Y19J6TSGJ1C65K4FMGA6',
            nickname: '사용자1',
            status: 'checked_in',
            checkedInAt: '2025-08-15T05:30:00.000Z',
          },
        ],
        summary: {
          total: 4,
          checkedIn: 1,
          noShow: 0,
          pending: 3,
        },
      },
    },
  })
  async getAttendanceStatus(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.attendanceService.getAttendanceStatus(
        meetingId,
        req.user.id,
      );
      return {
        status: 200,
        message: '출석 현황 조회 성공',
        result: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: error.message,
          result: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('meetings/:meetingId/mark-no-show')
  @UseGuards(LocationVerifiedGuard)
  @ApiOperation({ summary: '노쇼 처리 (호스트 전용)' })
  @ApiResponse({
    status: 200,
    description: '노쇼 처리 성공',
    example: {
      status: 200,
      message: '노쇼 처리가 완료되었습니다.',
      result: true,
      data: {
        noShowCount: 2,
        processedUsers: [
          '01K2P1Y19J6TSGJ1C65K4FMGA6',
          '01K2P1Y19J6TSGJ1C65K4FMGA7',
        ],
      },
    },
  })
  async markNoShow(@Param('meetingId') meetingId: string, @Request() req: any) {
    try {
      const result = await this.attendanceService.markNoShow(
        meetingId,
        req.user.id,
      );
      return {
        status: 200,
        message: '노쇼 처리가 완료되었습니다.',
        result: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: error.message,
          result: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('my-attendance/:meetingId')
  @ApiOperation({ summary: '내 출석 상태 조회' })
  @ApiResponse({
    status: 200,
    description: '출석 상태 조회 성공',
    example: {
      status: 200,
      message: '출석 상태 조회 성공',
      result: true,
      data: {
        status: 'checked_in',
        checkedInAt: '2025-08-15T05:30:00.000Z',
        canCheckIn: false,
      },
    },
  })
  async getMyAttendance(
    @Param('meetingId') meetingId: string,
    @Request() req: any,
  ) {
    try {
      const result = await this.attendanceService.getMyAttendance(
        meetingId,
        req.user.id,
      );
      return {
        status: 200,
        message: '출석 상태 조회 성공',
        result: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 400,
          message: error.message,
          result: false,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
