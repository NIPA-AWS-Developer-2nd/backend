import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from '../../entities/mission.entity';
import { Meeting, MeetingStatus } from '../../entities/meeting.entity';
import { UserMission } from '../../entities/user-mission.entity';
import { MeetingParticipant, ParticipantStatus } from '../../entities/meeting-participant.entity';
import { HomeData, HotMeeting, MyMeeting } from './types';
import { ActivityLog } from '../../entities/activity-log.entity';
import { MeetingSchedulerService } from '../scheduler/meeting-scheduler.service';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @InjectRepository(Mission)
    private readonly missionRepository: Repository<Mission>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(UserMission)
    private readonly userMissionRepository: Repository<UserMission>,
    @InjectRepository(MeetingParticipant)
    private readonly meetingParticipantRepository: Repository<MeetingParticipant>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly schedulerService: MeetingSchedulerService,
  ) {}

  async getHomeData(userId: string, limit: number = 10): Promise<HomeData> {
    this.logger.log(`Getting home data for user ${userId}`);

    const [availableMissions, hotMeetings, myMeetings, activityLogs] =
      await Promise.all([
        this.getAvailableMissions(userId, limit),
        this.getHotMeetings(userId, limit),
        this.getMyMeetings(userId, limit),
        this.getActivityLogs(userId, limit),
      ]);

    const result = {
      availableMissions,
      hotMeetings,
      myMeetings,
      activityLogs,
      currentUser: {
        id: userId,
      },
    };


    return result;
  }

  // 내 모임 상세 정보 조회
  async getMyMeetingDetail(userId: string, meetingId: string): Promise<any> {
    this.logger.log(`Getting meeting detail for user ${userId}, meeting ${meetingId}`);

    // 사용자가 해당 모임에 참여하고 있는지 확인
    const participation = await this.meetingParticipantRepository
      .createQueryBuilder('participant')
      .where('participant.userId = :userId', { userId })
      .andWhere('participant.meetingId = :meetingId', { meetingId })
      .getOne();

    if (!participation) {
      throw new Error('해당 모임에 참여하지 않았습니다.');
    }

    // 모임 상세 정보 조회
    const meeting = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoin('meeting.mission', 'mission')
      .leftJoin('mission.district', 'district')
      .leftJoin('meeting.host', 'host')
      .leftJoin('host.profile', 'hostProfile')
      .leftJoin('meeting.profile', 'meetingProfile')
      .addSelect([
        'mission.id',
        'mission.title',
        'mission.description',
        'mission.basePoints',
        'mission.difficulty',
        'mission.location',
        'mission.thumbnailUrl',
        'mission.precautions',
        'district.id',
        'district.districtName',
        'district.city',
        'host.id',
        'hostProfile.nickname',
        'hostProfile.profileImageUrl',
        'hostProfile.points',
        'hostProfile.mbti',
        'hostProfile.bio',
        'meetingProfile.id',
      ])
      .where('meeting.id = :meetingId', { meetingId })
      .getOne();

    if (!meeting) {
      throw new Error('모임을 찾을 수 없습니다.');
    }

    // 참가자 리스트 조회 (호스트 포함)
    const participants = await this.meetingParticipantRepository
      .createQueryBuilder('participant')
      .leftJoin('participant.user', 'user')
      .leftJoin('user.profile', 'profile')
      .addSelect([
        'user.id',
        'profile.nickname',
        'profile.profileImageUrl',
        'profile.points',
        'profile.mbti',
        'profile.bio',
      ])
      .where('participant.meetingId = :meetingId', { meetingId })
      .andWhere('participant.status = :status', { status: ParticipantStatus.JOINED })
      .orderBy('participant.joinedAt', 'ASC')
      .getMany();

    return {
      id: meeting.id,
      title: meeting.mission?.title || '모임',
      description: meeting.mission?.description || '',
      scheduledAt: meeting.scheduledAt,
      recruitUntil: meeting.recruitUntil,
      status: meeting.status,
      introduction: meeting.introduction,
      focusScore: meeting.focusScore,
      maxParticipants: meeting.maxParticipants,
      currentParticipants: participants.length,
      mission: meeting.mission ? {
        id: meeting.mission.id,
        title: meeting.mission.title,
        description: meeting.mission.description,
        basePoints: meeting.mission.basePoints,
        difficulty: meeting.mission.difficulty,
        location: meeting.mission.location,
        thumbnailUrl: meeting.mission.thumbnailUrl,
        precautions: meeting.mission.precautions || [],
      } : null,
      region: meeting.mission?.district ? {
        id: meeting.mission.district.id,
        districtName: meeting.mission.district.districtName,
        city: meeting.mission.district.city,
      } : null,
      host: meeting.host?.profile ? {
        id: meeting.host.id,
        nickname: meeting.host.profile.nickname,
        profileImageUrl: meeting.host.profile.profileImageUrl,
        level: Math.floor((meeting.host.profile.points || 0) / 100) + 1,
        mbti: meeting.host.profile.mbti,
        bio: meeting.host.profile.bio,
      } : null,
      participants: participants.map(p => ({
        id: p.user?.id || '',
        nickname: p.user?.profile?.nickname || '익명',
        profileImageUrl: p.user?.profile?.profileImageUrl || '',
        level: Math.floor((p.user?.profile?.points || 0) / 100) + 1,
        mbti: p.user?.profile?.mbti,
        bio: p.user?.profile?.bio,
        isHost: p.user?.id === meeting.hostUserId,
        joinedAt: p.joinedAt,
      })),
      chatRoomId: meeting.profile?.id || null, // 채팅방 ID (추후 구현)
    };
  }

  private async getAvailableMissions(
    userId: string,
    limit: number,
  ): Promise<Mission[]> {
    const missions = await this.missionRepository
      .createQueryBuilder('mission')
      .leftJoin('mission.category', 'category')
      .leftJoin('mission.district', 'district')
      .addSelect(['category.name', 'district.districtName'])
      .where('mission.isActive = :isActive', { isActive: true })
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM user_missions um WHERE um."missionId" = mission.id AND um."userId" = :userId)',
        { userId },
      )
      .orderBy('mission.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    this.logger.log(
      `Found ${missions.length} available missions for user ${userId}`,
    );
    return missions;
  }

  // HOT한 번개 모임 조회 (좋아요 수 + 참가 인원 수 기준)
  private async getHotMeetings(
    userId: string,
    limit: number,
  ): Promise<HotMeeting[]> {
    
    // 전체 recruiting 모임 개수 확인
    const totalRecruitingCount = await this.meetingRepository.count({
      where: { status: MeetingStatus.RECRUITING }
    });
    
    // 마감이 지나지 않은 recruiting 모임 개수 확인  
    const activeRecruitingCount = await this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.status = :status', { status: MeetingStatus.RECRUITING })
      .andWhere('meeting.recruitUntil > :now', { now: new Date() })
      .getCount();
    
    // 호스트가 다른 recruiting 모임 개수 확인
    const otherHostCount = await this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.status = :status', { status: MeetingStatus.RECRUITING })
      .andWhere('meeting.recruitUntil > :now', { now: new Date() })
      .andWhere('meeting.hostUserId != :userId', { userId })
      .getCount();

    const hotMeetings = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoin('meeting.mission', 'mission')
      .leftJoin('mission.district', 'district')
      .leftJoin('meeting.host', 'host')
      .leftJoin('host.profile', 'hostProfile')
      .leftJoin('meeting_participants', 'mp', 'mp."meetingId" = meeting.id')
      .leftJoin('meeting_likes', 'ml', 'ml."meetingId" = meeting.id')
      .addSelect([
        'mission.title',
        'mission.difficulty',
        'mission.basePoints',
        'mission.location',
        'mission.thumbnailUrl',
        'district.id',
        'district.districtName',
        'district.city',
        'host.id',
        'hostProfile.nickname',
        'hostProfile.profileImageUrl',
        'hostProfile.points',
        'hostProfile.mbti',
        'hostProfile.bio',
      ])
      .where('meeting.status = :status', { status: MeetingStatus.RECRUITING })
      .andWhere('meeting.recruitUntil > :now', { now: new Date() })
      .andWhere('meeting.hostUserId != :userId', { userId })
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM meeting_participants mp2 WHERE mp2."meetingId" = meeting.id AND mp2."userId" = :userId)',
        { userId },
      )
      .groupBy('meeting.id, mission.id, district.id, host.id, hostProfile.id')
      .addSelect('COUNT(DISTINCT mp.id)', 'currentParticipants')
      .addSelect('COUNT(DISTINCT ml.id)', 'likesCount')
      .orderBy('(COUNT(DISTINCT ml.id) + COUNT(DISTINCT mp.id))', 'DESC') // 실시간 좋아요 수 + 참가 인원 수로 정렬
      .limit(limit)
      .getRawAndEntities();
      


    // 각 모임의 참가자 프로필 이미지들을 가져오기
    const meetingsWithParticipants = await Promise.all(
      hotMeetings.entities.map(async (meeting, index) => {
        const raw = hotMeetings.raw[index] as { 
          currentParticipants: string;
          likesCount: string;
        };

        // 해당 모임의 참가자들의 프로필 이미지 가져오기
        const participantProfiles = await this.meetingParticipantRepository
          .createQueryBuilder('mp')
          .leftJoin('mp.user', 'user')
          .leftJoin('user.profile', 'profile')
          .addSelect(['profile.profileImageUrl'])
          .where('mp.meetingId = :meetingId', { meetingId: meeting.id })
          .andWhere('mp.status = :status', { status: ParticipantStatus.JOINED })
          .limit(5) // 최대 5명의 프로필 이미지만
          .getMany();
        
        return {
          id: meeting.id,
          title: meeting.mission?.title || '모임',
          scheduledAt: meeting.scheduledAt,
          location: meeting.mission?.location || undefined,
          maxParticipants: meeting.maxParticipants,
          currentParticipants: parseInt(raw.currentParticipants) || 0,
          likesCount: parseInt(raw.likesCount) || 0,
          hostName: meeting.host?.profile?.nickname || '익명',
          host: meeting.host?.profile ? {
            id: meeting.host.id,
            nickname: meeting.host.profile.nickname,
            profileImageUrl: meeting.host.profile.profileImageUrl,
            level: Math.floor((meeting.host.profile.points || 0) / 100) + 1, // 포인트로 레벨 계산
            mbti: meeting.host.profile.mbti,
            bio: meeting.host.profile.bio,
          } : undefined,
          region: meeting.mission?.district ? {
            id: meeting.mission.district.id,
            districtName: meeting.mission.district.districtName,
            city: meeting.mission.district.city,
          } : undefined,
          participants: participantProfiles.map(p => ({
            profileImageUrl: p.user?.profile?.profileImageUrl || '',
          })).filter(p => p.profileImageUrl),
          mission: meeting.mission
            ? {
                title: meeting.mission.title,
                difficulty: meeting.mission.difficulty,
                basePoints: meeting.mission.basePoints,
                thumbnailUrl: meeting.mission.thumbnailUrl,
              }
            : undefined,
        };
      })
    );

    return meetingsWithParticipants;
  }

  // 내 참여/완료 모임 조회
  private async getMyMeetings(
    userId: string,
    limit: number,
  ): Promise<MyMeeting[]> {
    
    // 호스팅 중인 모임들
    const hostMeetings = await this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoin('meeting.mission', 'mission')
      .leftJoin('meeting_participants', 'mp', 'mp."meetingId" = meeting.id')
      .addSelect([
        'meeting.id',
        'meeting.status', 
        'meeting.scheduledAt',
        'meeting.recruitUntil',
        'meeting.hostUserId',
        'meeting.maxParticipants',
        'meeting.minimumParticipants',
        'meeting.createdAt',
        'meeting.updatedAt',
        'mission.title', 
        'mission.basePoints', 
        'mission.thumbnailUrl', 
        'mission.difficulty', 
        'mission.location'
      ])
      .where('meeting.hostUserId = :userId', { userId })
      .groupBy('meeting.id, mission.id')
      .addSelect('COUNT(mp.id)', 'participantCount')
      .orderBy('meeting.scheduledAt', 'DESC')
      .getRawAndEntities();

    // 참여 중인 모임들 (호스트가 아닌 모임만)
    const participantMeetings = await this.meetingParticipantRepository
      .createQueryBuilder('participant')
      .leftJoin('participant.meeting', 'meeting')
      .leftJoin('meeting.mission', 'mission')
      .leftJoin('meeting_participants', 'mp', 'mp."meetingId" = meeting.id')
      .addSelect([
        'meeting.id',
        'meeting.status',
        'meeting.scheduledAt',
        'meeting.recruitUntil',
        'meeting.hostUserId',
        'meeting.maxParticipants',
        'meeting.minimumParticipants',
        'meeting.createdAt',
        'meeting.updatedAt',
        'meeting.focusScore',
        'meeting.introduction',
        'mission.id',
        'mission.title',
        'mission.basePoints',
        'mission.thumbnailUrl',
        'mission.difficulty',
        'mission.description',
        'mission.location',
      ])
      .where('participant.userId = :userId', { userId })
      .andWhere('meeting.hostUserId != :userId', { userId }) // 호스트인 모임 제외
      .andWhere('participant.status = :participantStatus', { participantStatus: ParticipantStatus.JOINED }) // 참여 상태만
      .groupBy('participant.id, meeting.id, mission.id')
      .addSelect('COUNT(mp.id)', 'participantCount')
      .orderBy('meeting.scheduledAt', 'DESC')
      .limit(limit)
      .getRawAndEntities();



    

    const myMeetings: MyMeeting[] = [];

    // 호스팅 모임들 추가 (스케줄러와 일치하는 상태 매핑)
    for (const [index, meeting] of hostMeetings.entities.entries()) {
      const raw = hostMeetings.raw[index] as { participantCount: string };
      
      // 실시간 상태 계산
      const currentStatus = this.schedulerService.calculateMeetingStatus(meeting);
      const status = this.mapMeetingStatusToHomeStatus(currentStatus);
      
      // 참가자 정보 조회
      const participants = await this.meetingParticipantRepository
        .createQueryBuilder('mp')
        .leftJoin('mp.user', 'user')
        .leftJoin('user.profile', 'profile')
        .addSelect(['user.id', 'profile.nickname', 'profile.profileImageUrl', 'mp.isHost'])
        .where('mp.meetingId = :meetingId', { meetingId: meeting.id })
        .andWhere('mp.status = :status', { status: ParticipantStatus.JOINED })
        .getMany();

      const meetingData = {
        id: meeting.id,
        title: meeting.mission?.title || '모임',
        status,
        scheduledAt: meeting.scheduledAt,
        recruitUntil: meeting.recruitUntil,
        isHost: true,
        meJoined: true, // 호스트는 항상 참여 중
        participantCount: parseInt(raw.participantCount) || 0,
        currentParticipants: parseInt(raw.participantCount) || 0,
        maxParticipants: meeting.maxParticipants,
        participants: participants.map(p => ({
          userId: p.user?.id || p.userId,
          nickname: p.user?.profile?.nickname,
          profileImageUrl: p.user?.profile?.profileImageUrl,
          isHost: p.isHost || false,
        })),
        mission: meeting.mission
          ? {
              title: meeting.mission.title,
              basePoints: meeting.mission.basePoints,
              thumbnailUrl: meeting.mission.thumbnailUrl,
              difficulty: meeting.mission.difficulty,
              location: meeting.mission.location || undefined,
            }
          : undefined,
      };
      
      myMeetings.push(meetingData);
    }

    // 참여 모임들 추가
    for (const [index, participant] of participantMeetings.entities.entries()) {
      const raw = participantMeetings.raw[index] as {
        participantCount: string;
      };
      const meeting = participant.meeting;
      
      // 필수 데이터 검증
      if (!meeting || !meeting.id || !meeting.scheduledAt) {
        this.logger.warn(`Invalid meeting data for participant ${participant.id}: missing meeting, id, or scheduledAt`);
        continue;
      }
      
      // 실시간 상태 계산
      const currentStatus = this.schedulerService.calculateMeetingStatus(meeting);
      const status = this.mapMeetingStatusToHomeStatus(currentStatus);
      
      // 참가자 정보 조회
      const participants = await this.meetingParticipantRepository
        .createQueryBuilder('mp')
        .leftJoin('mp.user', 'user')
        .leftJoin('user.profile', 'profile')
        .addSelect(['user.id', 'profile.nickname', 'profile.profileImageUrl', 'mp.isHost'])
        .where('mp.meetingId = :meetingId', { meetingId: meeting.id })
        .andWhere('mp.status = :status', { status: ParticipantStatus.JOINED })
        .getMany();

      const meetingData = {
        id: meeting.id,
        title: meeting.mission?.title || '모임',
        status,
        scheduledAt: meeting.scheduledAt,
        recruitUntil: meeting.recruitUntil,
        isHost: false,
        meJoined: true, // 참여 중인 모임만 조회했으므로 true
        participantCount: parseInt(raw.participantCount) || 0,
        currentParticipants: parseInt(raw.participantCount) || 0,
        maxParticipants: meeting.maxParticipants,
        participants: participants.map(p => ({
          userId: p.user?.id || p.userId,
          nickname: p.user?.profile?.nickname,
          profileImageUrl: p.user?.profile?.profileImageUrl,
          isHost: p.isHost || false,
        })),
        mission: meeting.mission
          ? {
              title: meeting.mission.title,
              basePoints: meeting.mission.basePoints,
              thumbnailUrl: meeting.mission.thumbnailUrl,
              difficulty: meeting.mission.difficulty,
              location: meeting.mission.location || undefined,
            }
          : undefined,
      };
      
      myMeetings.push(meetingData);
    }

    // 날짜 순으로 정렬하고 제한
    return myMeetings
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, limit);
  }

  // 모임 상태를 홈 화면용 상태로 매핑
  private mapMeetingStatusToHomeStatus(
    meetingStatus: MeetingStatus,
  ): 'recruiting' | 'ready' | 'active' | 'completed' {
    switch (meetingStatus) {
      case MeetingStatus.RECRUITING:
        return 'recruiting'; // 모집중
      case MeetingStatus.READY:
        return 'ready'; // 준비중 (모집 마감 ~ 활동 시작 전)
      case MeetingStatus.ACTIVE:
        return 'active'; // 진행중 (활동 시작 ~ +12h)
      case MeetingStatus.COMPLETED:
        return 'completed'; // 완료됨
      case MeetingStatus.CANCELED:
      default:
        return 'completed'; // 취소된 모임도 완료로 표시
    }
  }

  // 내 활동 로그 조회
  private async getActivityLogs(
    userId: string,
    limit: number,
  ): Promise<ActivityLog[]> {
    try {
      return await this.activityLogRepository
        .createQueryBuilder('log')
        .leftJoin('log.meeting', 'meeting')
        .leftJoin('meeting.mission', 'mission')
        .leftJoin('log.relatedUser', 'relatedUser')
        .leftJoin('relatedUser.profile', 'relatedProfile')
        .addSelect([
          'meeting.id',
          'mission.title',
          'relatedUser.id',
          'relatedProfile.nickname',
        ])
        .where('log.userId = :userId', { userId })
        .orderBy('log.createdAt', 'DESC')
        .limit(limit)
        .getMany();
    } catch (error) {
      // Activity logs table doesn't exist yet, return empty array
      this.logger.warn('Activity logs table not found, returning empty array');
      return [];
    }
  }
}
