import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ulid } from 'ulid';
import { Meeting } from '../../entities/meeting.entity';
import {
  MeetingAttendance,
  AttendanceStatus,
} from '../../entities/meeting-attendance.entity';
import { MeetingParticipant } from '../../entities/meeting-participant.entity';
import { UserProfile } from '../../entities/user-profile.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(MeetingAttendance)
    private attendanceRepository: Repository<MeetingAttendance>,
    @InjectRepository(MeetingParticipant)
    private participantRepository: Repository<MeetingParticipant>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
  ) {}

  async generateQRCode(meetingId: string, hostUserId: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new BadRequestException('모임을 찾을 수 없습니다.');
    }

    if (meeting.hostUserId !== hostUserId) {
      throw new ForbiddenException('호스트만 QR 코드를 생성할 수 있습니다.');
    }

    if (meeting.status !== 'active' && meeting.status !== 'ready') {
      throw new BadRequestException(
        '준비됨 또는 진행 중인 모임에서만 QR 코드를 생성할 수 있습니다.',
      );
    }

    // QR 코드 토큰 생성 (ULID 기반)
    const qrCodeToken = ulid();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30분 후 만료

    // 모임 정보 업데이트
    await this.meetingRepository.update(meetingId, {
      qrCodeToken,
      qrGeneratedAt: new Date(),
    });

    // 호스트 자동 출석 처리
    await this.autoCheckInHost(meetingId, hostUserId);

    return {
      qrCodeToken,
      expiresAt,
    };
  }

  async checkIn(meetingId: string, userId: string, qrCodeToken: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new BadRequestException('모임을 찾을 수 없습니다.');
    }

    if (meeting.status !== 'active' && meeting.status !== 'ready') {
      throw new BadRequestException(
        '준비됨 또는 진행 중인 모임에서만 출석체크가 가능합니다.',
      );
    }

    if (!meeting.qrCodeToken || meeting.qrCodeToken !== qrCodeToken) {
      throw new BadRequestException('유효하지 않은 QR 코드입니다.');
    }

    // QR 코드 만료 시간 체크 (30분)
    if (meeting.qrGeneratedAt) {
      const expiresAt = new Date(meeting.qrGeneratedAt);
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      if (new Date() > expiresAt) {
        throw new BadRequestException('QR 코드가 만료되었습니다.');
      }
    }

    // 참가자인지 확인
    const participant = await this.participantRepository.findOne({
      where: { meetingId, userId },
    });

    if (!participant) {
      throw new BadRequestException('해당 모임의 참가자가 아닙니다.');
    }

    // 이미 출석체크한 경우
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { meetingId, userId },
    });

    if (
      existingAttendance &&
      existingAttendance.status === AttendanceStatus.CHECKED_IN
    ) {
      throw new BadRequestException('이미 출석체크를 완료했습니다.');
    }

    // 출석체크 기록 생성/업데이트
    const verificationData = {
      qrCodeToken,
      checkedInAt: new Date().toISOString(),
    };

    if (existingAttendance) {
      // 기존 출석 기록 업데이트
      existingAttendance.status = AttendanceStatus.CHECKED_IN;
      existingAttendance.checkedInAt = new Date();
      existingAttendance.verification = verificationData;
      await this.attendanceRepository.save(existingAttendance);
    } else {
      // 새 출석 기록 생성
      const newAttendance = this.attendanceRepository.create({
        id: ulid(),
        meetingId,
        userId,
        status: AttendanceStatus.CHECKED_IN,
        checkedInAt: new Date(),
        verification: verificationData,
      });
      await this.attendanceRepository.save(newAttendance);
    }

    const attendanceId = existingAttendance?.id || ulid();
    const checkedInTime = new Date();

    // 참가자가 출석체크했을 때 호스트도 자동 출석 처리
    await this.autoCheckInHost(meetingId, meeting.hostUserId);

    return {
      attendanceId,
      checkedInAt: checkedInTime,
    };
  }

  async getAttendanceStatus(meetingId: string, requestUserId: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new BadRequestException('모임을 찾을 수 없습니다.');
    }

    // 호스트 또는 참가자만 조회 가능
    const participant = await this.participantRepository.findOne({
      where: { meetingId, userId: requestUserId },
    });

    const isHost = meeting.hostUserId === requestUserId;

    if (!isHost && !participant) {
      throw new ForbiddenException(
        '해당 모임의 참가자만 출석 현황을 볼 수 있습니다.',
      );
    }

    // 모든 참가자 조회
    const participants = await this.participantRepository.find({
      where: { meetingId },
      relations: ['user', 'user.profile'],
    });

    // 출석 현황 조회
    const attendances = await this.attendanceRepository.find({
      where: { meetingId },
    });

    const attendanceMap = new Map(attendances.map((att) => [att.userId, att]));

    const result = participants.map((participant) => {
      const attendance = attendanceMap.get(participant.userId);
      return {
        userId: participant.userId,
        nickname: participant.user?.profile?.nickname || '사용자',
        profileImageUrl: participant.user?.profile?.profileImageUrl,
        isHost: participant.isHost,
        status: attendance?.status || 'pending',
        checkedInAt: attendance?.checkedInAt,
        noShowMarkedAt: attendance?.noShowMarkedAt,
      };
    });

    const summary = {
      total: participants.length,
      checkedIn: result.filter((r) => r.status === AttendanceStatus.CHECKED_IN)
        .length,
      noShow: result.filter((r) => r.status === AttendanceStatus.NO_SHOW)
        .length,
      pending: result.filter((r) => r.status === 'pending').length,
    };

    return {
      attendances: result,
      summary,
      canGenerateQR:
        isHost && (meeting.status === 'active' || meeting.status === 'ready'),
      qrCodeActive:
        !!meeting.qrCodeToken &&
        meeting.qrGeneratedAt &&
        new Date() <=
          new Date(meeting.qrGeneratedAt.getTime() + 30 * 60 * 1000),
    };
  }

  async markNoShow(meetingId: string, hostUserId: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new BadRequestException('모임을 찾을 수 없습니다.');
    }

    if (meeting.hostUserId !== hostUserId) {
      throw new ForbiddenException('호스트만 노쇼 처리를 할 수 있습니다.');
    }

    if (meeting.status !== 'active' && meeting.status !== 'completed') {
      throw new BadRequestException(
        '진행 중이거나 완료된 모임에서만 노쇼 처리가 가능합니다.',
      );
    }

    // 참가자 중 출석체크하지 않은 사람들 조회
    const participants = await this.participantRepository.find({
      where: { meetingId },
    });

    const attendances = await this.attendanceRepository.find({
      where: { meetingId },
    });

    const checkedInUserIds = new Set(
      attendances
        .filter((att) => att.status === AttendanceStatus.CHECKED_IN)
        .map((att) => att.userId),
    );

    const noShowUsers = participants
      .filter((p) => !p.isHost && !checkedInUserIds.has(p.userId))
      .map((p) => p.userId);

    // 노쇼 처리
    const processedUsers: string[] = [];
    for (const userId of noShowUsers) {
      const existingAttendance = attendances.find(
        (att) => att.userId === userId,
      );

      if (existingAttendance) {
        // 기존 출석 기록 업데이트
        existingAttendance.status = AttendanceStatus.NO_SHOW;
        existingAttendance.noShowMarkedAt = new Date();
        await this.attendanceRepository.save(existingAttendance);
      } else {
        // 새 출석 기록 생성
        const newAttendance = this.attendanceRepository.create({
          id: ulid(),
          meetingId,
          userId,
          status: AttendanceStatus.NO_SHOW,
          noShowMarkedAt: new Date(),
        });
        await this.attendanceRepository.save(newAttendance);
      }

      processedUsers.push(userId);
    }

    return {
      noShowCount: processedUsers.length,
      processedUsers,
    };
  }

  async getMyAttendance(meetingId: string, userId: string) {
    const meeting = await this.meetingRepository.findOne({
      where: { id: meetingId },
    });

    if (!meeting) {
      throw new BadRequestException('모임을 찾을 수 없습니다.');
    }

    // 참가자인지 확인
    const participant = await this.participantRepository.findOne({
      where: { meetingId, userId },
    });

    if (!participant) {
      throw new BadRequestException('해당 모임의 참가자가 아닙니다.');
    }

    const attendance = await this.attendanceRepository.findOne({
      where: { meetingId, userId },
    });

    // 출석체크 가능 여부 판단
    const canCheckIn =
      (meeting.status === 'active' || meeting.status === 'ready') &&
      !!meeting.qrCodeToken &&
      meeting.qrGeneratedAt &&
      new Date() <=
        new Date(meeting.qrGeneratedAt.getTime() + 30 * 60 * 1000) &&
      (!attendance || attendance.status !== AttendanceStatus.CHECKED_IN);

    return {
      status: attendance?.status || 'pending',
      checkedInAt: attendance?.checkedInAt,
      noShowMarkedAt: attendance?.noShowMarkedAt,
      canCheckIn,
      qrCodeActive:
        !!meeting.qrCodeToken &&
        meeting.qrGeneratedAt &&
        new Date() <=
          new Date(meeting.qrGeneratedAt.getTime() + 30 * 60 * 1000),
    };
  }

  private async autoCheckInHost(meetingId: string, hostUserId: string) {
    // 호스트의 기존 출석 기록 확인
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { meetingId, userId: hostUserId },
    });

    if (
      existingAttendance &&
      existingAttendance.status === AttendanceStatus.CHECKED_IN
    ) {
      // 이미 출석체크 완료된 경우
      return;
    }

    // 호스트 자동 출석 처리
    const verificationData = {
      autoCheckIn: true,
      checkedInAt: new Date().toISOString(),
      reason: 'QR 코드 생성 또는 참가자 출석체크 완료',
    };

    if (existingAttendance) {
      // 기존 출석 기록 업데이트
      existingAttendance.status = AttendanceStatus.CHECKED_IN;
      existingAttendance.checkedInAt = new Date();
      existingAttendance.verification = verificationData;
      await this.attendanceRepository.save(existingAttendance);
    } else {
      // 새 출석 기록 생성
      const newAttendance = this.attendanceRepository.create({
        id: ulid(),
        meetingId,
        userId: hostUserId,
        status: AttendanceStatus.CHECKED_IN,
        checkedInAt: new Date(),
        verification: verificationData,
      });
      await this.attendanceRepository.save(newAttendance);
    }
  }
}
